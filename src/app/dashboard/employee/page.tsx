import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employee") redirect("/dashboard");

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [{ data: todayJobs }, { data: weekJobs }, { data: timesheets }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start")
      .eq("employee_id", user.id)
      .eq("scheduled_date", todayKey)
      .order("scheduled_start", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start")
      .eq("employee_id", user.id)
      .gte("scheduled_date", weekStart.toISOString().slice(0, 10))
      .lt("scheduled_date", weekEnd.toISOString().slice(0, 10))
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("timesheets")
      .select("id, clock_in, clock_out, worked_hours, created_at")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(14)
  ]);

  async function clockInAction() {
    "use server";
    const sb = await createClient();
    const {
      data: { user: employee }
    } = await sb.auth.getUser();
    if (!employee) redirect("/auth/login");
    await sb.from("timesheets").insert({ employee_id: employee.id, clock_in: new Date().toISOString() });
    revalidatePath("/dashboard/employee");
  }

  async function clockOutAction() {
    "use server";
    const sb = await createClient();
    const {
      data: { user: employee }
    } = await sb.auth.getUser();
    if (!employee) redirect("/auth/login");
    const { data: openEntry } = await sb
      .from("timesheets")
      .select("id, clock_in")
      .eq("employee_id", employee.id)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .maybeSingle();
    if (openEntry) {
      const workedHours = (Date.now() - new Date(openEntry.clock_in).getTime()) / (1000 * 60 * 60);
      await sb
        .from("timesheets")
        .update({ clock_out: new Date().toISOString(), worked_hours: Number(workedHours.toFixed(2)) })
        .eq("id", openEntry.id);
    }
    revalidatePath("/dashboard/employee");
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Employee Dashboard</h1>
      <p className="text-sm text-[#64748b]">Welcome {profile?.full_name ?? user.email}</p>

      <div className="flex gap-2">
        <form action={clockInAction}>
          <button type="submit" className="rounded bg-[#0db8c8] px-6 py-3 text-base font-semibold text-white hover:bg-[#0a9dab]">
            Clock In
          </button>
        </form>
        <form action={clockOutAction}>
          <button type="submit" className="rounded border border-[#1e3a5f] bg-white px-6 py-3 text-base font-semibold text-[#1e3a5f]">
            Clock Out
          </button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Today</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(todayJobs ?? []).map((job) => (
              <div key={job.id} className="rounded border p-2">
                <p className="font-medium">{job.title ?? "Job"}</p>
                <p className="text-[#64748b]">{job.scheduled_start ?? "--:--"} · {job.status ?? "scheduled"}</p>
              </div>
            ))}
            {(todayJobs ?? []).length === 0 ? <p className="text-[#64748b]">No jobs today.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">This Week</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(weekJobs ?? []).map((job) => (
              <div key={job.id} className="rounded border p-2">
                <p className="font-medium">{job.title ?? "Job"}</p>
                <p className="text-[#64748b]">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"} · {job.status ?? "scheduled"}
                </p>
              </div>
            ))}
            {(weekJobs ?? []).length === 0 ? <p className="text-[#64748b]">No jobs this week.</p> : null}
          </div>
        </article>
      </div>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Timesheet History</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(timesheets ?? []).map((entry: any) => (
            <div key={entry.id} className="rounded border p-2">
              <p className="font-medium">
                {entry.created_at ? new Date(entry.created_at).toLocaleDateString("en-AU") : "-"}
              </p>
              <p className="text-[#64748b]">
                {entry.clock_in ? new Date(entry.clock_in).toLocaleTimeString("en-AU") : "--"} -{" "}
                {entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString("en-AU") : "--"} ·{" "}
                {Number(entry.worked_hours ?? 0).toFixed(2)}h
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

