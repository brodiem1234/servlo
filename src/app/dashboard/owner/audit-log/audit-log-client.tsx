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
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  deleted: "bg-red-100 text-red-800",
  exported: "bg-purple-100 text-purple-800",
  viewed: "bg-gray-100 text-gray-700",
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
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #64748b)" }}>
            Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            <option value="all">All actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="exported">Exported</option>
            <option value="viewed">Viewed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #64748b)" }}>
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #64748b)" }}>
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
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
            <tr className="text-xs text-left uppercase tracking-wide" style={{ background: "#f1f5f9" }}>
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
                <tr key={entry.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs" style={{ color: "var(--text-secondary, #64748b)" }}>
                    {new Date(entry.created_at).toLocaleString("en-AU", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
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
