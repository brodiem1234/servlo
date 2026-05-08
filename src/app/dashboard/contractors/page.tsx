"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { filterDemoEntities } from "@/lib/demo/visibility";
import ContractorsManager from "./contractors-manager";

type Contractor = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  trade_type: string | null;
  licences: string[] | null;
  hourly_rate: number | null;
  role: string | null;
  abn: string | null;
  business_name: string | null;
  is_demo?: boolean | null;
};

export default async function ContractorsPage() {
  const { user, enabled, supabase } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "contractors");

  const { data: contractors } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, trade_type, licences, hourly_rate, role, abn, business_name, is_demo")
    .eq("owner_id", user.id)
    .eq("role", "contractor")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  async function createContractorAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    let licences: string[] = [];
    try { licences = JSON.parse(String(formData.get("licences") ?? "[]")); } catch { licences = []; }
    const { error } = await sb.from("employees").insert({
      owner_id: owner.id,
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      trade_type: String(formData.get("trade_type") ?? "") || null,
      licences,
      hourly_rate: Number(formData.get("hourly_rate") ?? 0),
      role: "contractor",
      abn: String(formData.get("abn") ?? "") || null,
      business_name: String(formData.get("business_name") ?? "") || null,
      is_demo: false
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/contractors");
    revalidatePath("/dashboard/owner/jobs");
  }

  async function updateContractorAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    let licences: string[] = [];
    try { licences = JSON.parse(String(formData.get("licences") ?? "[]")); } catch { licences = []; }
    const { error } = await sb
      .from("employees")
      .update({
        full_name: String(formData.get("full_name") ?? ""),
        email: String(formData.get("email") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        trade_type: String(formData.get("trade_type") ?? "") || null,
        licences,
        hourly_rate: Number(formData.get("hourly_rate") ?? 0),
        abn: String(formData.get("abn") ?? "") || null,
        business_name: String(formData.get("business_name") ?? "") || null
      })
      .eq("id", id)
      .eq("owner_id", owner.id)
      .eq("role", "contractor");
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/contractors");
    revalidatePath("/dashboard/owner/jobs");
  }

  async function deleteContractorAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    // Soft delete — keeps data recoverable for 30 days
    const { error } = await sb
      .from("employees")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", owner.id)
      .eq("role", "contractor");
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/contractors");
    revalidatePath("/dashboard/owner/jobs");
  }

  const visibleContractors = filterDemoEntities((contractors ?? []) as Contractor[]);

  return (
    <section className="space-y-5">
      <ContractorsManager
        contractors={visibleContractors}
        createContractorAction={createContractorAction}
        updateContractorAction={updateContractorAction}
        deleteContractorAction={deleteContractorAction}
      />
    </section>
  );
}
