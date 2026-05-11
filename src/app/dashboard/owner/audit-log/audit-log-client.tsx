"use client";

import { useState } from "react";

type AuditEntry = {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  action: string;
  changed_fields: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-500/15 text-green-400 border border-green-500/20",
  updated: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  deleted: "bg-red-500/15 text-red-400 border border-red-500/20",
  exported: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  viewed: "bg-zinc-100 dark:bg-white/5 text-[var(--text-secondary)] border border-zinc-200 dark:border-white/10",
};

export function AuditLogClient({ entries }: { entries: AuditEntry[] }) {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = entries.filter((e) => {
    if (actionFilter !== "all" && e.action !== actionFilter) return false;
    if (dateFrom && e.created_at < dateFrom) return false;
    if (dateTo && e.created_at > dateTo + "T23:59:59") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end w-full">
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #64748b)" }}>
            Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="all">All actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="exported">Exported</option>
            <option value="viewed">Viewed</option>
          </select>
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #64748b)" }}>
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #64748b)" }}>
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        {(actionFilter !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => { setActionFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="text-sm underline"
            style={{ color: "var(--text-secondary, #64748b)" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-left uppercase tracking-wide bg-zinc-50 dark:bg-white/5">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-secondary, #64748b)" }}>
                  No audit log entries match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs" style={{ color: "var(--text-secondary, #64748b)" }}>
                    {new Date(entry.created_at).toLocaleString("en-AU", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[entry.action] ?? "bg-zinc-100 dark:bg-white/5 text-[var(--text-secondary)] border border-zinc-200 dark:border-white/10"}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.table_name}</td>
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-[160px]">
                    {entry.record_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary, #64748b)" }}>
                    {entry.ip_address ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs" style={{ color: "var(--text-secondary, #94a3b8)" }}>
        Showing last 200 entries.
      </p>
    </div>
  );
}
