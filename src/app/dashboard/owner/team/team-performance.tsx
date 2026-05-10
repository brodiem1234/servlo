"use client";

import { useState, useMemo } from "react";

type Employee = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  hourly_rate: number | null;
  created_at: string | null;
};

type Timesheet = {
  id: string;
  employee_id: string | null;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  date: string | null;
  notes: string | null;
};

type Job = {
  id: string;
  employee_id: string | null;
  status: string | null;
  scheduled_start: string | null;
};

type LeaveRequest = {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: "pending" | "approved" | "declined";
  notes: string | null;
  created_at: string;
};

interface Props {
  employees: Employee[];
  timesheets: Timesheet[];
  jobs: Job[];
}

const PERIOD_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function hoursForEmployee(sheets: Timesheet[], employeeId: string, since: Date): number {
  return sheets
    .filter((s) => {
      if (s.employee_id !== employeeId) return false;
      const d = s.clock_in ? new Date(s.clock_in) : s.date ? new Date(s.date) : null;
      return d && d >= since;
    })
    .reduce((sum, s) => sum + (s.total_hours ?? 0), 0);
}

function jobsForEmployee(jobs: Job[], employeeId: string, since: Date): number {
  return jobs.filter((j) => {
    if (j.employee_id !== employeeId) return false;
    const d = j.scheduled_start ? new Date(j.scheduled_start) : null;
    return d && d >= since && j.status === "completed";
  }).length;
}

export function TeamPerformance({ employees, timesheets, jobs }: Props) {
  const [periodIdx, setPeriodIdx] = useState(1); // default 30 days
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "hours" | "jobs" | "cost">("hours");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveEmployeeId, setLeaveEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("annual");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const period = PERIOD_OPTIONS[periodIdx];
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - period.days);
    return d;
  }, [period.days]);

  const activeEmployees = employees.filter((e) => (e.status ?? "active") !== "inactive");

  // Compute per-employee stats
  const employeeStats = useMemo(() => {
    return activeEmployees
      .map((emp) => {
        const hours = hoursForEmployee(timesheets, emp.id, since);
        const completedJobs = jobsForEmployee(jobs, emp.id, since);
        const cost = hours * (emp.hourly_rate ?? 0);
        const utilisation = period.days > 0 ? Math.min(100, Math.round((hours / (period.days * 8)) * 100)) : 0;
        return { emp, hours, completedJobs, cost, utilisation };
      })
      .filter((s) => !search || (s.emp.full_name ?? "").toLowerCase().includes(search.toLowerCase()));
  }, [activeEmployees, timesheets, jobs, since, period.days, search]);

  const sorted = useMemo(() => {
    return [...employeeStats].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortBy === "name") return sortDir === "asc"
        ? (a.emp.full_name ?? "").localeCompare(b.emp.full_name ?? "")
        : (b.emp.full_name ?? "").localeCompare(a.emp.full_name ?? "");
      if (sortBy === "hours") { av = a.hours; bv = b.hours; }
      if (sortBy === "jobs") { av = a.completedJobs; bv = b.completedJobs; }
      if (sortBy === "cost") { av = a.cost; bv = b.cost; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [employeeStats, sortBy, sortDir]);

  const totals = useMemo(() => ({
    hours: employeeStats.reduce((s, e) => s + e.hours, 0),
    jobs: employeeStats.reduce((s, e) => s + e.completedJobs, 0),
    cost: employeeStats.reduce((s, e) => s + e.cost, 0),
    avgUtil: employeeStats.length > 0 ? Math.round(employeeStats.reduce((s, e) => s + e.utilisation, 0) / employeeStats.length) : 0,
  }), [employeeStats]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span className={`ml-1 text-xs ${sortBy === col ? "text-blue-400" : "text-slate-500"}`}>
      {sortBy === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  );

  function addLeave() {
    if (!leaveEmployeeId || !leaveStart || !leaveEnd) {
      showToast("Please fill all required fields", false);
      return;
    }
    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);
    if (end < start) {
      showToast("End date must be after start date", false);
      return;
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const emp = employees.find((e) => e.id === leaveEmployeeId);
    const newReq: LeaveRequest = {
      id: crypto.randomUUID(),
      employee_id: leaveEmployeeId,
      employee_name: emp?.full_name ?? "Unknown",
      leave_type: leaveType,
      start_date: leaveStart,
      end_date: leaveEnd,
      days,
      status: "pending",
      notes: leaveNotes.trim() || null,
      created_at: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    setShowLeaveForm(false);
    setLeaveEmployeeId("");
    setLeaveStart("");
    setLeaveEnd("");
    setLeaveNotes("");
    showToast(`Leave request for ${emp?.full_name ?? "employee"} submitted`);
  }

  function updateLeaveStatus(id: string, status: "approved" | "declined") {
    setLeaveRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    showToast(`Leave request ${status}`);
  }

  const leaveTypeLabel: Record<string, string> = {
    annual: "Annual Leave",
    sick: "Sick Leave",
    personal: "Personal Leave",
    unpaid: "Unpaid Leave",
    bereavement: "Bereavement",
    parental: "Parental Leave",
  };

  const utilisationColor = (u: number) =>
    u >= 70 ? "bg-emerald-500" : u >= 40 ? "bg-amber-400" : "bg-red-400";

  const [activeTab, setActiveTab] = useState<"performance" | "leave">("performance");

  return (
    <div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Team Members", value: activeEmployees.length.toString(), icon: "👥", color: "text-blue-500" },
          { label: `Hours Logged (${period.label})`, value: totals.hours.toFixed(1) + "h", icon: "⏱", color: "text-emerald-500" },
          { label: `Jobs Completed (${period.label})`, value: totals.jobs.toString(), icon: "✅", color: "text-indigo-500" },
          { label: "Avg Utilisation", value: totals.avgUtil + "%", icon: "📊", color: "text-amber-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{kpi.icon}</span>
              <span className="text-xs text-[var(--text-muted)] truncate">{kpi.label}</span>
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-[var(--border)]">
        {([["performance", "Performance"], ["leave", "Leave Requests"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? "border-blue-500 text-blue-400" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
          >
            {label}
            {id === "leave" && leaveRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {leaveRequests.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "performance" && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              {PERIOD_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => setPeriodIdx(i)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${periodIdx === i ? "bg-blue-600 text-white" : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Search team members"
            />
          </div>

          {/* Performance table */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm" aria-label="Team performance table">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]">
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">
                    <button onClick={() => toggleSort("name")} className="flex items-center hover:text-[var(--text-primary)]">
                      Employee <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden sm:table-cell">Role</th>
                  <th className="text-right px-4 py-3 text-[var(--text-muted)] font-medium">
                    <button onClick={() => toggleSort("hours")} className="flex items-center ml-auto hover:text-[var(--text-primary)]">
                      Hours <SortIcon col="hours" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-[var(--text-muted)] font-medium hidden md:table-cell">
                    <button onClick={() => toggleSort("jobs")} className="flex items-center ml-auto hover:text-[var(--text-primary)]">
                      Jobs Done <SortIcon col="jobs" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-[var(--text-muted)] font-medium hidden lg:table-cell">
                    <button onClick={() => toggleSort("cost")} className="flex items-center ml-auto hover:text-[var(--text-primary)]">
                      Labour Cost <SortIcon col="cost" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-[var(--text-muted)] font-medium hidden md:table-cell">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      {search ? "No team members match your search" : "No active team members"}
                    </td>
                  </tr>
                ) : (
                  sorted.map(({ emp, hours, completedJobs, cost, utilisation }) => (
                    <tr key={emp.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(emp.full_name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{emp.full_name ?? "—"}</div>
                            <div className="text-xs text-[var(--text-muted)] hidden sm:block">{emp.email ?? ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] hidden sm:table-cell capitalize">
                        {emp.role ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">
                        {hours.toFixed(1)}h
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-secondary)] hidden md:table-cell">
                        {completedJobs}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-secondary)] hidden lg:table-cell">
                        {emp.hourly_rate ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cost) : "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${utilisationColor(utilisation)}`}
                              style={{ width: `${utilisation}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] w-8 text-right">{utilisation}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {sorted.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[var(--border)] bg-[var(--bg-card)]">
                    <td className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)]" colSpan={2}>Total / Average</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-primary)]">{totals.hours.toFixed(1)}h</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-primary)] hidden md:table-cell">{totals.jobs}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-primary)] hidden lg:table-cell">
                      {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(totals.cost)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-muted)] hidden md:table-cell">Avg {totals.avgUtil}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {activeTab === "leave" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Leave Requests</h3>
            <button
              onClick={() => setShowLeaveForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              + New Request
            </button>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
              <div className="text-4xl mb-3">🌴</div>
              <p className="text-[var(--text-secondary)] font-medium">No leave requests</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Submit a request when a team member needs time off</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {req.employee_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">{req.employee_name}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {leaveTypeLabel[req.leave_type] ?? req.leave_type} · {req.days} day{req.days !== 1 ? "s" : ""}
                        {" · "}{new Date(req.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        {" – "}{new Date(req.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status === "pending" ? (
                      <>
                        <span className="rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">Pending</span>
                        <button
                          onClick={() => updateLeaveStatus(req.id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          aria-label={`Approve leave for ${req.employee_name}`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateLeaveStatus(req.id, "declined")}
                          className="rounded-lg border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                          aria-label={`Decline leave for ${req.employee_name}`}
                        >
                          Decline
                        </button>
                      </>
                    ) : req.status === "approved" ? (
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Approved</span>
                    ) : (
                      <span className="rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">Declined</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Leave request form modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="New leave request">
          <div className="w-full max-w-md rounded-2xl bg-[#1e2433] p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-[var(--text-primary)]">New Leave Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Employee *</label>
                <select
                  value={leaveEmployeeId}
                  onChange={(e) => setLeaveEmployeeId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select employee…</option>
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name ?? emp.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(leaveTypeLabel).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">End Date *</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    min={leaveStart}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes (optional)</label>
                <textarea
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason, context, coverage arranged…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowLeaveForm(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={addLeave}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium text-white transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
