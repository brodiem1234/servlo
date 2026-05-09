"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string | null;
  client_name: string | null;
  assignee: string | null;
  address: string | null;
  suburb: string | null;
  is_demo: boolean | null;
};

interface Props {
  jobs: Job[];
  weekStart: string; // ISO date YYYY-MM-DD (Monday)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDay(dateStr: string): { day: string; num: string } {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.toLocaleDateString("en-AU", { weekday: "short" }),
    num: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
  };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_COLORS: Record<string, string> = {
  completed:   "bg-emerald-500/20 border-emerald-500/60 text-emerald-300",
  in_progress: "bg-blue-500/20 border-blue-500/60 text-blue-300",
  cancelled:   "bg-red-500/20 border-red-500/60 text-red-300 opacity-60",
  pending:     "bg-amber-500/20 border-amber-500/60 text-amber-300",
  scheduled:   "bg-indigo-500/20 border-indigo-500/60 text-indigo-300",
};

function statusColor(status: string | null): string {
  return STATUS_COLORS[status ?? "scheduled"] ?? STATUS_COLORS.scheduled;
}

export function ScheduleWeekView({ jobs: initialJobs, weekStart }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const today = todayStr();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const jobsByDay = new Map<string, Job[]>();
  for (const day of days) jobsByDay.set(day, []);
  for (const job of jobs) {
    const d = job.scheduled_date;
    if (d && jobsByDay.has(d)) jobsByDay.get(d)!.push(job);
  }

  const handleDragStart = useCallback((e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData("jobId", jobId);
    setDraggingId(jobId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: string) => {
    e.preventDefault();
    setDropTarget(date);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newDate: string) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    setDropTarget(null);
    setDraggingId(null);

    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.scheduled_date === newDate) return;
    if (job.is_demo) { showToast("Demo jobs cannot be rescheduled", false); return; }

    // Optimistic update
    const prev = jobs;
    setJobs((js) => js.map((j) => j.id === jobId ? { ...j, scheduled_date: newDate } : j));

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_date: newDate }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      showToast(`"${job.title ?? "Job"}" moved to ${new Date(newDate + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}`);
      router.refresh();
    } catch {
      setJobs(prev);
      showToast("Could not reschedule job", false);
    }
  }, [jobs, router]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  return (
    <div>
      {/* Week grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-xl overflow-hidden border border-[var(--border)]">
        {days.map((day) => {
          const { day: dayLabel, num } = formatDay(day);
          const isToday = day === today;
          const isTarget = dropTarget === day;
          const dayJobs = jobsByDay.get(day) ?? [];

          return (
            <div
              key={day}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
              onDragLeave={() => setDropTarget(null)}
              className={`min-h-[200px] bg-[var(--bg-card)] flex flex-col transition-colors ${isTarget ? "bg-blue-900/30" : ""}`}
            >
              {/* Day header */}
              <div className={`px-2 py-2 border-b border-[var(--border)] ${isToday ? "bg-blue-600/20" : ""}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? "text-blue-400" : "text-[var(--text-muted)]"}`}>
                  {dayLabel}
                </div>
                <div className={`text-xs font-bold mt-0.5 ${isToday ? "text-blue-300" : "text-[var(--text-secondary)]"}`}>
                  {num}
                </div>
              </div>

              {/* Jobs */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto max-h-72">
                {dayJobs.length === 0 && isTarget && (
                  <div className="rounded border-2 border-dashed border-blue-500/50 h-10 flex items-center justify-center text-[10px] text-blue-400">
                    Drop here
                  </div>
                )}
                {dayJobs
                  .sort((a, b) => (a.scheduled_start ?? "00:00").localeCompare(b.scheduled_start ?? "00:00"))
                  .map((job) => (
                    <div
                      key={job.id}
                      draggable={!job.is_demo}
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedJob(job)}
                      className={`rounded border px-1.5 py-1 text-[11px] cursor-pointer select-none transition-all
                        ${statusColor(job.status)}
                        ${draggingId === job.id ? "opacity-40 scale-95" : "hover:scale-[1.02] hover:shadow-md"}
                        ${!job.is_demo ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                      `}
                      title={`${job.title ?? "Job"} — drag to reschedule`}
                      aria-label={`${job.title ?? "Job"}, ${job.status ?? "scheduled"}. Drag to reschedule.`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}
                    >
                      <div className="font-semibold truncate leading-tight">{job.title ?? "Untitled"}</div>
                      {job.scheduled_start && (
                        <div className="opacity-70 mt-0.5">{job.scheduled_start.slice(0, 5)}</div>
                      )}
                      {job.client_name && (
                        <div className="opacity-60 truncate">{job.client_name}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 px-1">
        {Object.entries({ scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed", pending: "Pending", cancelled: "Cancelled" }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <div className={`h-3 w-3 rounded border ${statusColor(key)}`} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] ml-2">
          <span>↔ Drag job to reschedule</span>
        </div>
      </div>

      {/* Job detail panel */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedJob.title ?? "Job details"}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedJob.title ?? "Untitled Job"}</h2>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium border ${statusColor(selectedJob.status)}`}>
                  {selectedJob.status ?? "scheduled"}
                </span>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <dl className="space-y-2 text-sm">
              {selectedJob.client_name && (
                <div className="flex gap-2">
                  <dt className="text-[var(--text-muted)] w-24 flex-shrink-0">Client</dt>
                  <dd className="text-[var(--text-primary)]">{selectedJob.client_name}</dd>
                </div>
              )}
              {selectedJob.scheduled_date && (
                <div className="flex gap-2">
                  <dt className="text-[var(--text-muted)] w-24 flex-shrink-0">Date</dt>
                  <dd className="text-[var(--text-primary)]">
                    {new Date(selectedJob.scheduled_date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                  </dd>
                </div>
              )}
              {(selectedJob.scheduled_start || selectedJob.scheduled_end) && (
                <div className="flex gap-2">
                  <dt className="text-[var(--text-muted)] w-24 flex-shrink-0">Time</dt>
                  <dd className="text-[var(--text-primary)]">
                    {[selectedJob.scheduled_start?.slice(0, 5), selectedJob.scheduled_end?.slice(0, 5)].filter(Boolean).join(" – ")}
                  </dd>
                </div>
              )}
              {selectedJob.assignee && (
                <div className="flex gap-2">
                  <dt className="text-[var(--text-muted)] w-24 flex-shrink-0">Assigned to</dt>
                  <dd className="text-[var(--text-primary)]">{selectedJob.assignee}</dd>
                </div>
              )}
              {(selectedJob.address || selectedJob.suburb) && (
                <div className="flex gap-2">
                  <dt className="text-[var(--text-muted)] w-24 flex-shrink-0">Location</dt>
                  <dd className="text-[var(--text-primary)]">
                    {[selectedJob.address, selectedJob.suburb].filter(Boolean).join(", ")}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex gap-2">
              <a
                href={`/dashboard/owner/jobs?highlight=${selectedJob.id}`}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white text-center hover:bg-blue-700"
              >
                Open Job
              </a>
              {selectedJob.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent([selectedJob.address, selectedJob.suburb].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                >
                  🗺 Map
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium text-white ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
