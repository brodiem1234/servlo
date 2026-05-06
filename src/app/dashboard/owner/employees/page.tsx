import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import EmployeesManager from "./employees-manager";
import { filterDemoEntities } from "@/lib/demo/visibility";

export default async function OwnerEmployeesPage() {
  const { user, enabled, supabase } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "employee_management");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, trade_type, licences, hourly_rate, role, is_demo")
    .eq("owner_id", user.id)
    .order("full_name", { ascending: true });

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
      />
    </section>
  );
}


