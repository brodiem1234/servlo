import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import EmployeesManager from "./employees-manager";

export default async function OwnerEmployeesPage() {
  const { user } = await getOwnerContext();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, trade_type, licences, hourly_rate, role")
    .eq("owner_id", user.id)
    .order("full_name", { ascending: true });

  async function createEmployeeAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const sb = createClient();
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
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const sb = createClient();
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

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Employees</h1>
      </div>
      <EmployeesManager
        employees={employees ?? []}
        createEmployeeAction={createEmployeeAction}
        updateEmployeeAction={updateEmployeeAction}
      />
    </section>
  );
}

