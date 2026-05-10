"use client";

import { useState, useEffect, useRef } from "react";

type TodayJob = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  notes: string | null;
  client_id: string | null;
  clients: { full_name: string | null } | null;
};

type WeekJob = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  address: string | null;
  suburb: string | null;
};

type Timesheet = {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  worked_hours: number | null;
  created_at: string;
};

type Notification = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  read: boolean;
  created_at: string;
};

type Props = {
  firstName: string;
  todayJobs: TodayJob[];
  weekJobs: WeekJob[];
  timesheets: Timesheet[];
  notifications: Notification[];
  weekHours: number;
  isClockedIn: boolean;
  showGpsClock: boolean;
  clockInAction: () => Promise<void>;
  clockOutAction: () => Promise<void>;
  updateJobStatusAction: (formData: FormData) => Promise<void>;
};

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  scheduled:   "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  in_progress: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  completed:   "bg-green-500/15 text-green-400 border border-green-500/20",
  cancelled:   "bg-white/5 text-[var(--text-muted)] border border-white/10",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending",
  scheduled:   "Scheduled",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

const NEXT_STATUS: Record<string, string> = {
  pending:     "in_progress",
  scheduled:   "in_progress",
  in_progress: "completed",
};

const NEXT_LABEL: Record<string, string> = {
  pending:     "Start Job",
  scheduled:   "Start Job",
  in_progress: "Mark Complete",
};

function fmt12(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

function mapsUrl(address: string | null, suburb: string | null, state: string | null) {
  const parts = [address, suburb, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

function ClockTimer({ clockedIn }: { clockedIn: boolean }) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (clockedIn) {
      setSecs(0);
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
      setSecs(0);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [clockedIn]);

  if (!clockedIn) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <span className="font-mono text-sm text-green-600">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export function EmployeeDashboardClient({
  firstName,
  todayJobs,
  weekJobs,
  timesheets,
  notifications,
  weekHours,
  isClockedIn,
  clockInAction,
  clockOutAction,
  updateJobStatusAction,
}: Props) {
  const [clockedIn, setClockedIn] = useState(isClockedIn);
  const [clockPending, setClockPending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [jobStatuses, setJobStatuses] = useState<Record<string, string>>(
    Object.fromEntries(todayJobs.map((j) => [j.id, j.status ?? "pending"]))
  );
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"today" | "week" | "hours">("today");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const visibleNotifs = notifications.filter((n) => !dismissedNotifs.has(n.id));

  async function handleClock() {
    setClockPending(true);
    try {
      if (clockedIn) {
        await clockOutAction();
        setClockedIn(false);
        setToast({ type: "success", message: "Clocked out successfully" });
      } else {
        await clockInAction();
        setClockedIn(true);
        setToast({ type: "success", message: "Clocked in!" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to update clock. Please try again." });
    } finally {
      setClockPending(false);
    }
  }

  async function handleStatusAdvance(job: TodayJob) {
    const current = jobStatuses[job.id] ?? job.status ?? "pending";
    const next = NEXT_STATUS[current];
    if (!next) return;
    setUpdatingJob(job.id);
    const prev = current;
    setJobStatuses((s) => ({ ...s, [job.id]: next }));
    try {
      const fd = new FormData();
      fd.set("job_id", job.id);
      fd.set("status", next);
      await updateJobStatusAction(fd);
      setToast({ type: "success", message: next === "completed" ? "Job marked complete!" : "Job started!" });
    } catch {
      setJobStatuses((s) => ({ ...s, [job.id]: prev }));
      setToast({ type: "error", message: "Failed to update job status." });
    } finally {
      setUpdatingJob(null);
    }
  }

  const weekTarget = 38;
  const weekPct = Math.min(100, Math.round((weekHours / weekTarget) * 100));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

        {/* Notifications */}
        {visibleNotifs.length > 0 && (
          <div className="space-y-2">
            {visibleNotifs.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <span className="text-lg mt-0.5">🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>}
                </div>
                <button
                  onClick={() => setDismissedNotifs((s) => new Set([...s, n.id]))}
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Clock In/Out */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {clockedIn ? "Currently clocked in" : "Not clocked in"}
              </p>
              <ClockTimer clockedIn={clockedIn} />
            </div>
            <button
              onClick={handleClock}
              disabled={clockPending}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                clockedIn
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {clockPending ? "…" : clockedIn ? "Clock Out" : "Clock In"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {(["today", "week", "hours"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-white"
                  : ""
              }`}
              style={
                activeTab === tab
                  ? { background: "var(--accent-color)", color: "#fff" }
                  : { color: "var(--text-secondary)" }
              }
            >
              {tab === "today" ? `Today (${todayJobs.length})` : tab === "week" ? "This Week" : "Hours"}
            </button>
          ))}
        </div>

        {/* Today's Jobs */}
        {activeTab === "today" && (
          <div className="space-y-3">
            {todayJobs.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>No jobs scheduled today</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Enjoy your day!</p>
              </div>
            ) : (
              todayJobs.map((job) => {
                const status = jobStatuses[job.id] ?? job.status ?? "pending";
                const nextStatus = NEXT_STATUS[status];
                const nextLabel = NEXT_LABEL[status];
                return (
                  <div
                    key={job.id}
                    className="rounded-2xl p-4 space-y-3"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {job.title ?? "Untitled job"}
                        </p>
                        {job.clients?.full_name && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {job.clients.full_name}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[status] ?? "bg-white/5 text-[var(--text-secondary)] border border-white/10"}`}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </div>

                    {/* Time */}
                    {(job.scheduled_start || job.scheduled_end) && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span>🕐</span>
                        <span>
                          {fmt12(job.scheduled_start)}
                          {job.scheduled_end ? ` – ${fmt12(job.scheduled_end)}` : ""}
                        </span>
                      </div>
                    )}

                    {/* Address */}
                    {(job.address || job.suburb) && (
                      <a
                        href={mapsUrl(job.address, job.suburb, job.state)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs hover:underline"
                        style={{ color: "var(--accent-color)" }}
                      >
                        <span>📍</span>
                        <span>{[job.address, job.suburb].filter(Boolean).join(", ")}</span>
                        <span className="text-xs opacity-60">↗</span>
                      </a>
                    )}

                    {/* Notes */}
                    {job.notes && (
                      <p className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                        {job.notes}
                      </p>
                    )}

                    {/* Action button */}
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusAdvance(job)}
                        disabled={updatingJob === job.id}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "var(--accent-color)" }}
                      >
                        {updatingJob === job.id ? "Updating…" : nextLabel}
                      </button>
                    )}
                    {status === "completed" && (
                      <div className="text-center text-sm font-medium text-emerald-600">✓ Completed</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Week Jobs */}
        {activeTab === "week" && (
          <div className="space-y-2">
            {weekJobs.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No jobs this week</p>
              </div>
            ) : (
              weekJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {job.title ?? "Untitled job"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {fmtDate(job.scheduled_date)}
                      {job.scheduled_start ? ` · ${fmt12(job.scheduled_start)}` : ""}
                      {job.suburb ? ` · ${job.suburb}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[job.status ?? "pending"] ?? "bg-white/5 text-[var(--text-secondary)] border border-white/10"}`}>
                    {STATUS_LABEL[job.status ?? "pending"] ?? job.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Hours */}
        {activeTab === "hours" && (
          <div className="space-y-4">
            {/* Summary card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>This week</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {weekHours.toFixed(1)}<span className="text-sm font-normal ml-1" style={{ color: "var(--text-muted)" }}>hrs</span>
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${weekPct}%`, background: "var(--accent-color)" }}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                {weekPct}% of {weekTarget}h target
              </p>
            </div>

            {/* Timesheet entries */}
            {timesheets.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No timesheets this week</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timesheets.map((t) => {
                  const clockIn = t.clock_in ? new Date(t.clock_in) : null;
                  const clockOut = t.clock_out ? new Date(t.clock_out) : null;
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl px-4 py-3 flex items-center justify-between"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {clockIn ? clockIn.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) : "—"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {clockIn ? clockIn.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }) : ""}
                          {clockOut ? ` – ${clockOut.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}` : " · In progress"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {t.worked_hours != null ? `${Number(t.worked_hours).toFixed(2)}h` : clockOut ? "" : <span className="text-emerald-500 text-xs">Active</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
