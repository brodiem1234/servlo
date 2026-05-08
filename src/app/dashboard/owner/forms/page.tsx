import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { COMPLIANCE_TEMPLATES } from "@/lib/compliance-templates";
import { FormsClient } from "./forms-client";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: forms } = await supabase
    .from("compliance_forms")
    .select("id, title, description, fields, is_active, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  async function createFromTemplateAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const templateIdx = Number(formData.get("template_index") ?? -1);
    const template = COMPLIANCE_TEMPLATES[templateIdx];
    if (!template) throw new Error("Template not found");

    const { error } = await sb.from("compliance_forms").insert({
      owner_id: owner.id,
      title: template.title,
      description: template.description,
      fields: template.fields,
      is_template: true,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/forms");
  }

  async function createBlankFormAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const title = String(formData.get("title") ?? "").trim() || "New Form";
    const { error } = await sb.from("compliance_forms").insert({
      owner_id: owner.id,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      fields: [],
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/forms");
  }

  async function updateFormAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const id = String(formData.get("id") ?? "");
    const fieldsRaw = String(formData.get("fields") ?? "[]");
    let fields;
    try { fields = JSON.parse(fieldsRaw); } catch { fields = []; }

    const { error } = await sb
      .from("compliance_forms")
      .update({
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        fields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/forms");
  }

  async function deleteFormAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const id = String(formData.get("id") ?? "");
    await sb.from("compliance_forms").delete().eq("id", id).eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner/forms");
  }

  return (
    <FormsClient
      initialForms={forms ?? []}
      templates={COMPLIANCE_TEMPLATES}
      createFromTemplateAction={createFromTemplateAction}
      createBlankFormAction={createBlankFormAction}
      updateFormAction={updateFormAction}
      deleteFormAction={deleteFormAction}
    />
  );
}
