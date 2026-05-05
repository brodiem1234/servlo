import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import JobsManager from "./jobs-manager";

export default async function OwnerJobsPage() {
  const { user } = await getOwnerContext();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const [{ data: jobs }, { data: clients }, { data: employees }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, description, client_id, employee_id, job_type, scheduled_date, start_time, end_time, address, suburb, state, priority, notes, status, client_name"
      )
      .eq("owner_id", user.id)
      .order("scheduled_date", { ascending: true }),
    supabase.from("clients").select("id, full_name").eq("owner_id", user.id).order("full_name"),
    supabase.from("employees").select("id, full_name").eq("owner_id", user.id).order("full_name")
  ]);

  async function createJobAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const sb = createClient();
    const { error } = await sb.from("jobs").insert({
      owner_id: owner.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      client_id: String(formData.get("client_id") ?? "") || null,
      employee_id: String(formData.get("employee_id") ?? "") || null,
      job_type: String(formData.get("job_type") ?? ""),
      scheduled_date: String(formData.get("scheduled_date") ?? "") || null,
      start_time: String(formData.get("start_time") ?? "") || null,
      end_time: String(formData.get("end_time") ?? "") || null,
      address: String(formData.get("address") ?? ""),
      suburb: String(formData.get("suburb") ?? ""),
      state: String(formData.get("state") ?? ""),
      priority: String(formData.get("priority") ?? "normal"),
      notes: String(formData.get("notes") ?? "")
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/jobs");
  }

  async function updateJobAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const sb = createClient();
    const { error } = await sb
      .from("jobs")
      .update({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        client_id: String(formData.get("client_id") ?? "") || null,
        employee_id: String(formData.get("employee_id") ?? "") || null,
        job_type: String(formData.get("job_type") ?? ""),
        scheduled_date: String(formData.get("scheduled_date") ?? "") || null,
        start_time: String(formData.get("start_time") ?? "") || null,
        end_time: String(formData.get("end_time") ?? "") || null,
        address: String(formData.get("address") ?? ""),
        suburb: String(formData.get("suburb") ?? ""),
        state: String(formData.get("state") ?? ""),
        priority: String(formData.get("priority") ?? "normal"),
        notes: String(formData.get("notes") ?? "")
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/jobs");
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Jobs</h1>
      </div>
      <JobsManager
        jobs={jobs ?? []}
        clients={(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        employees={(employees ?? []).map((e) => ({ id: e.id, label: e.full_name ?? "Unnamed employee" }))}
        createJobAction={createJobAction}
        updateJobAction={updateJobAction}
      />
    </section>
  );
}

