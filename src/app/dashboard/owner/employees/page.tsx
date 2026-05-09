import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import EmployeesManager from "./employees-manager";
import { filterDemoEntities } from "@/lib/demo/visibility";
import { getUserPlan } from "@/lib/plan-limits";

export default async function OwnerEmployeesPage() {
  const { user, enabled, supabase } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "employee_management");

  const userPlan = await getUserPlan(user.id);

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, trade_type, licences, hourly_rate, role, is_demo")
    .eq("owner_id", user.id)
    .order("full_name", { ascending: true });

  // Fetch pending/expired invitations for this business
  const admin = createAdminClient();
  const { data: businessRow } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const pendingInvitations = businessRow
    ? (await admin
        .from("team_invitations")
        .select("id, invited_email, role, status, created_at, expires_at")
        .eq("business_id", businessRow.id)
        .in("status", ["pending", "expired"])
        .order("created_at", { ascending: false }))
        .data ?? []
    : [];

  async function createEmployeeAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const { error } = await sb.from("employees").insert({
      owner_id: owner.id,
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      trade_type: String(formData.get("trade_type") ?? ""),
      licences: JSON.parse(String(formData.get("licences") ?? "[]")),
      hourly_rate: Number(formData.get("hourly_rate") ?? 0),
      role: "employee"
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/employees");
  }

  async function updateEmployeeAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const { error } = await sb
      .from("employees")
      .update({
        full_name: String(formData.get("full_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        trade_type: String(formData.get("trade_type") ?? ""),
        licences: JSON.parse(String(formData.get("licences") ?? "[]")),
        hourly_rate: Number(formData.get("hourly_rate") ?? 0)
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/employees");
  }

  const visibleEmployees = filterDemoEntities(employees ?? []);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Employees</h1>
      </div>
      <EmployeesManager
        employees={visibleEmployees}
        createEmployeeAction={createEmployeeAction}
        updateEmployeeAction={updateEmployeeAction}
        userPlan={userPlan}
        pendingInvitations={pendingInvitations as Array<{
          id: string;
          invited_email: string;
          role: string;
          status: string;
          created_at: string;
          expires_at: string;
        }>}
      />
    </section>
  );
}
