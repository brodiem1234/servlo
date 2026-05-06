import Link from "next/link";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";

export const dynamic = "force-dynamic";

function localIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ScheduleSearchParams = Promise<{ date?: string | string[] } | undefined>;

export default async function SchedulePage({ searchParams }: { searchParams?: ScheduleSearchParams }) {
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "scheduling");

  const resolvedParams = searchParams ? await searchParams : {};
  const sp = resolvedParams ?? {};
  const raw = typeof sp.date === "string" ? sp.date.trim() : Array.isArray(sp.date) ? sp.date[0]?.trim() ?? "" : "";
  const todayKey = localIsoDate(new Date());
  const dateKey =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.slice(0, 10) : todayKey;

  const { data: jobsRaw } = await sb
    .from("jobs")
    .select(
      "id, title, scheduled_date, scheduled_start, scheduled_end, status, client_name, address, suburb, state, is_demo"
    )
    .eq("owner_id", user.id)
    .eq("scheduled_date", dateKey)
    .order("scheduled_start", { ascending: true });

  const jobs = jobsRaw ?? [];
  const label = new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/schedule?date=${todayKey}`}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
          >
            Jump to today
          </Link>
          <Link
            href="/dashboard/owner/jobs"
            className="rounded-md bg-[var(--accent-color)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            All jobs
          </Link>
        </div>
      </div>

      <ul className="space-y-2">
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
                    {job.client_name ?? "—"}
                    {job.address || job.suburb
                      ? ` · ${[job.address, job.suburb, job.state].filter(Boolean).join(", ")}`
                      : ""}
                  </p>
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
      </ul>
    </section>
  );
}
