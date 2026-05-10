"use client";

import { useState } from "react";

type Job = {
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

const ALL_STATUSES = ["pending", "scheduled", "in_progress", "completed", "cancelled"];

function fmt12(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}${ampm}`;
}

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function mapsUrl(address: string | null, suburb: string | null, state: string | null) {
  const q = [address, suburb, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().slice(0, 10);
}

function isUpcoming(dateStr: string | null) {
  if (!dateStr) return false;
  return dateStr > new Date().toISOString().slice(0, 10);
}

export function EmployeeJobsClient({ jobs }: { jobs: Job[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = jobs.filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        (j.title ?? "").toLowerCase().includes(q) ||
        (j.suburb ?? "").toLowerCase().includes(q) ||
        (j.address ?? "").toLowerCase().includes(q) ||
        (j.clients?.full_name ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const todayCount = jobs.filter((j) => isToday(j.scheduled_date)).length;
  const upcomingCount = jobs.filter((j) => isUpcoming(j.scheduled_date)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Jobs</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {todayCount} today · {upcomingCount} upcoming
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search jobs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 flex-1 rounded-lg border px-3 text-sm"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border px-3 text-sm"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-3xl mb-2">📋</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>No jobs found</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {search || statusFilter !== "all" ? "Try adjusting your filters" : "No jobs assigned in the next 60 days"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const isOpen = expanded === job.id;
            const today = isToday(job.scheduled_date);
            return (
              <div
                key={job.id}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  border: today ? "2px solid var(--accent-color)" : "1px solid var(--border)",
                }}
              >
                {/* Row */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : job.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Date pill */}
                  <div className="shrink-0 text-center w-12">
                    {job.scheduled_date ? (
                      <>
                        <div className="text-xs font-bold uppercase" style={{ color: "var(--accent-color)" }}>
                          {new Date(job.scheduled_date + "T00:00:00").toLocaleDateString("en-AU", { month: "short" })}
                        </div>
                        <div className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
                          {new Date(job.scheduled_date + "T00:00:00").getDate()}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>TBC</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {job.title ?? "Untitled job"}
                      </span>
                      {today && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "var(--accent-color)" }}>
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 flex flex-wrap gap-x-3" style={{ color: "var(--text-muted)" }}>
                      {job.clients?.full_name && <span>{job.clients.full_name}</span>}
                      {job.suburb && <span>{job.suburb}</span>}
                      {job.scheduled_start && <span>{fmt12(job.scheduled_start)}{job.scheduled_end ? ` – ${fmt12(job.scheduled_end)}` : ""}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[job.status ?? "pending"] ?? "bg-white/5 text-[var(--text-secondary)] border border-white/10"}`}>
                      {STATUS_LABEL[job.status ?? "pending"] ?? job.status}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {job.scheduled_date && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Date</p>
                          <p style={{ color: "var(--text-primary)" }}>{fmtDate(job.scheduled_date)}</p>
                        </div>
                      )}
                      {(job.scheduled_start || job.scheduled_end) && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Time</p>
                          <p style={{ color: "var(--text-primary)" }}>
                            {fmt12(job.scheduled_start)}{job.scheduled_end ? ` – ${fmt12(job.scheduled_end)}` : ""}
                          </p>
                        </div>
                      )}
                      {job.clients?.full_name && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Client</p>
                          <p style={{ color: "var(--text-primary)" }}>{job.clients.full_name}</p>
                        </div>
                      )}
                    </div>

                    {(job.address || job.suburb) && (
                      <a
                        href={mapsUrl(job.address, job.suburb, job.state)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg font-medium"
                        style={{ background: "var(--bg-secondary)", color: "var(--accent-color)" }}
                      >
                        <span>📍</span>
                        <span>{[job.address, job.suburb, job.state].filter(Boolean).join(", ")}</span>
                        <span className="ml-auto text-xs opacity-60">Open Maps ↗</span>
                      </a>
                    )}

                    {job.notes && (
                      <div className="text-sm rounded-lg px-3 py-2" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                        <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</p>
                        {job.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
