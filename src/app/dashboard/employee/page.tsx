import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isIndustrySlug, type IndustrySlug } from "@/lib/industries";
import { loadWorkspaceFeatureSet } from "@/lib/workspace-features";
import type { SupabaseClient } from "@supabase/supabase-js";

async function resolveEmployeeOwnerId(sb: SupabaseClient, userId: string, email: string | undefined) {
  const [{ data: jobOwner }, { data: empOwner }] = await Promise.all([
    sb.from("jobs").select("owner_id").eq("employee_id", userId).limit(1).maybeSingle(),
    email
      ? sb.from("employees").select("owner_id").eq("email", email).limit(1).maybeSingle()
      : Promise.resolve({ data: null })
  ]);
  return jobOwner?.owner_id ?? empOwner?.owner_id ?? null;
}

async function employeeWorkspaceHasGpsClock(sb: SupabaseClient, userId: string, email: string | undefined) {
  const ownerId = await resolveEmployeeOwnerId(sb, userId, email);
  if (!ownerId) return false;
  const { data: ownerProf } = await sb.from("profiles").select("industry_tags").eq("id", ownerId).maybeSingle();
  const tags = Array.isArray((ownerProf as { industry_tags?: unknown } | null)?.industry_tags)
    ? ((ownerProf as { industry_tags: string[] }).industry_tags ?? []).filter((t): t is IndustrySlug => isIndustrySlug(t))
    : [];
  const feats = await loadWorkspaceFeatureSet(sb, ownerId, tags);
  return feats.has("gps_clock");
}

export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employee") redirect("/dashboard");

  const showGpsClock = await employeeWorkspaceHasGpsClock(supabase, user.id, user.email ?? undefined);

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
    if (!(await employeeWorkspaceHasGpsClock(sb, employee.id, employee.email ?? undefined))) {
      redirect("/dashboard/employee");
    }
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
    <section className="dashboard-theme min-h-screen space-y-6 bg-[var(--bg-primary)] p-4 text-[var(--text-primary)] md:p-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Employee Dashboard</h1>
      <p className="text-sm text-[var(--text-secondary)]">Welcome {profile?.full_name ?? user.email}</p>

      {showGpsClock ? (
        <div className="flex gap-2">
          <form action={clockInAction}>
            <button type="submit" className="rounded bg-[var(--accent-color)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--accent-hover)]">
              Clock In
            </button>
          </form>
          <form action={clockOutAction}>
            <button
              type="submit"
              className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3 text-base font-semibold text-[var(--text-primary)]"
            >
              Clock Out
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Clock in/out is turned off for your workspace. Ask your owner to enable GPS clock in Settings → Workspace features.</p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(todayJobs ?? []).map((job) => (
              <div key={job.id} className="rounded border border-[var(--border)] p-2">
                <p className="font-medium text-[var(--text-primary)]">{job.title ?? "Job"}</p>
                <p className="text-[var(--text-secondary)]">{job.scheduled_start ?? "--:--"} · {job.status ?? "scheduled"}</p>
              </div>
            ))}
            {(todayJobs ?? []).length === 0 ? <p className="text-[var(--text-secondary)]">No jobs today.</p> : null}
          </div>
        </article>

        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">This Week</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(weekJobs ?? []).map((job) => (
              <div key={job.id} className="rounded border border-[var(--border)] p-2">
                <p className="font-medium text-[var(--text-primary)]">{job.title ?? "Job"}</p>
                <p className="text-[var(--text-secondary)]">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"} · {job.status ?? "scheduled"}
                </p>
              </div>
            ))}
            {(weekJobs ?? []).length === 0 ? <p className="text-[var(--text-secondary)]">No jobs this week.</p> : null}
          </div>
        </article>
      </div>

      <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Timesheet History</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(timesheets ?? []).map((entry: any) => (
            <div key={entry.id} className="rounded border border-[var(--border)] p-2">
              <p className="font-medium text-[var(--text-primary)]">
                {entry.created_at ? new Date(entry.created_at).toLocaleDateString("en-AU") : "-"}
              </p>
              <p className="text-[var(--text-secondary)]">
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

