import Link from "next/link";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { ScheduleWeekView } from "./schedule-week-view";

export const dynamic = "force-dynamic";

function localIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Get Monday of the week for a given date
function weekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localIsoDate(d);
}

type ScheduleSearchParams = Promise<{ date?: string | string[]; view?: string | string[] } | undefined>;

export default async function SchedulePage({ searchParams }: { searchParams?: ScheduleSearchParams }) {
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "scheduling");

  const resolvedParams = searchParams ? await searchParams : {};
  const sp = resolvedParams ?? {};
  const raw = typeof sp.date === "string" ? sp.date.trim() : Array.isArray(sp.date) ? sp.date[0]?.trim() ?? "" : "";
  const viewRaw = typeof sp.view === "string" ? sp.view : Array.isArray(sp.view) ? sp.view[0] : "week";
  const view = viewRaw === "day" ? "day" : "week";
  const todayKey = localIsoDate(new Date());
  const dateKey =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.slice(0, 10) : todayKey;
  const weekStartKey = weekMonday(dateKey);
  const weekEndKey = (() => { const d = new Date(weekStartKey + "T00:00:00"); d.setDate(d.getDate() + 6); return localIsoDate(d); })();

  const jobsResult = await sb
    .from("jobs")
    .select("id, title, scheduled_date, scheduled_start, scheduled_end, status, client_id, employee_id, address, suburb, state, is_demo")
    .eq("owner_id", user.id)
    .gte("scheduled_date", view === "week" ? weekStartKey : dateKey)
    .lte("scheduled_date", view === "week" ? weekEndKey : dateKey)
    .is("deleted_at", null)
    .order("scheduled_start", { ascending: true });

  const jobs = jobsResult.data ?? [];
  const clientIds = jobs.map((j: { client_id?: string | null }) => j.client_id).filter((id): id is string => Boolean(id));
  const employeeIds = jobs.map((j: { employee_id?: string | null }) => j.employee_id).filter((id): id is string => Boolean(id));

  const [{ data: clientRows }, { data: employeeRows }] = await Promise.all([
    clientIds.length === 0
      ? { data: [] as Array<{ id: string; full_name: string | null }> }
      : sb.from("clients").select("id, full_name").in("id", clientIds).eq("owner_id", user.id),
    employeeIds.length === 0
      ? { data: [] as Array<{ id: string; full_name: string | null; role: string | null }> }
      : sb.from("employees").select("id, full_name, role").in("id", employeeIds).eq("owner_id", user.id),
  ]);

  const clientNameById = new Map((clientRows ?? []).map((row) => [row.id, row.full_name]));
  const assigneeById = new Map(
    (employeeRows ?? []).map((row: { id: string; full_name: string | null; role: string | null }) => [
      row.id,
      { name: row.full_name ?? "Unknown", isContractor: (row.role ?? "").toLowerCase() === "contractor" },
    ])
  );
  const label = new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const prevWeek = (() => { const d = new Date(weekStartKey + "T00:00:00"); d.setDate(d.getDate() - 7); return localIsoDate(d); })();
  const nextWeek = (() => { const d = new Date(weekStartKey + "T00:00:00"); d.setDate(d.getDate() + 7); return localIsoDate(d); })();
  const weekRange = `${new Date(weekStartKey + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${new Date(weekEndKey + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {view === "week" ? weekRange : label}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
            <Link href={`/dashboard/schedule?date=${dateKey}&view=week`} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "week" ? "bg-[var(--accent-color)] text-white" : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}>Week</Link>
            <Link href={`/dashboard/schedule?date=${dateKey}&view=day`}  className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "day"  ? "bg-[var(--accent-color)] text-white" : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}>Day</Link>
          </div>
          {/* Week navigation */}
          {view === "week" && (
            <>
              <Link href={`/dashboard/schedule?date=${prevWeek}&view=week`} className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]" aria-label="Previous week">‹</Link>
              <Link href={`/dashboard/schedule?date=${nextWeek}&view=week`} className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]" aria-label="Next week">›</Link>
            </>
          )}
          <Link
            href={`/dashboard/schedule?date=${todayKey}&view=${view}`}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Today
          </Link>
          <Link
            href="/dashboard/owner/jobs"
            className="rounded-md bg-[var(--accent-color)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            All jobs
          </Link>
        </div>
      </div>

      {/* Week view */}
      {view === "week" && (
        <ScheduleWeekView
          weekStart={weekStartKey}
          jobs={jobs.map((job) => ({
            id: job.id,
            title: job.title ?? null,
            scheduled_date: job.scheduled_date ?? null,
            scheduled_start: job.scheduled_start ?? null,
            scheduled_end: job.scheduled_end ?? null,
            status: job.status ?? null,
            client_name: job.client_id ? (clientNameById.get(job.client_id) ?? null) : null,
            assignee: (job as { employee_id?: string | null }).employee_id ? (assigneeById.get((job as { employee_id: string }).employee_id)?.name ?? null) : null,
            address: job.address ?? null,
            suburb: job.suburb ?? null,
            is_demo: job.is_demo ?? null,
          }))}
        />
      )}

      {view === "day" && <ul className="space-y-2">
        {jobs.length === 0 ? (
          <li className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-muted)]">
            No jobs scheduled for this day.
          </li>
        ) : (
          jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{job.title ?? "Untitled job"}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {[job.scheduled_start?.slice(0, 5), job.scheduled_end?.slice(0, 5)]
                      .filter(Boolean)
                      .join(" – ") || "Time TBC"}{" "}
                    · {job.status ?? "scheduled"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {(job.client_id ? clientNameById.get(job.client_id) : null) ?? "—"}
                    {job.address || job.suburb
                      ? ` · ${[job.address, job.suburb, job.state].filter(Boolean).join(", ")}`
                      : ""}
                  </p>
                  {(job as { employee_id?: string | null }).employee_id ? (() => {
                    const assignee = assigneeById.get((job as { employee_id: string }).employee_id);
                    return assignee ? (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Assigned: {assignee.name}
                        {assignee.isContractor ? <span className="ml-1 rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] font-semibold">Contractor</span> : null}
                      </p>
                    ) : null;
                  })() : null}
                </div>
                <Link
                  href={`/dashboard/owner/jobs?openJob=${encodeURIComponent(job.id)}`}
                  className="shrink-0 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-color)] hover:bg-[var(--bg-primary)]"
                >
                  Open job
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>}
    </section>
  );
}
