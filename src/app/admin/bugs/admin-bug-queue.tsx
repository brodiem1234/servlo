"use client";

import { useState } from "react";
import { Bug, CheckCircle, XCircle, Copy, Gift } from "lucide-react";

type BugReport = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  page_url: string | null;
  severity: string;
  status: string;
  free_month_awarded: boolean;
  admin_notes: string | null;
  screenshot_url: string | null;
  created_at: string;
  resolved_at: string | null;
  owner_email?: string;
  owner_business?: string;
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  verified: "bg-emerald-500/15 text-emerald-400",
  duplicate: "bg-gray-500/15 text-gray-400",
  fixed: "bg-blue-500/15 text-blue-400",
  rejected: "bg-red-500/15 text-red-400",
};

export default function AdminBugQueue({ bugs }: { bugs: BugReport[] }) {
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [awardFreeMonth, setAwardFreeMonth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localBugs, setLocalBugs] = useState(bugs);

  const pending = localBugs.filter(b => b.status === "pending");
  const resolved = localBugs.filter(b => b.status !== "pending");

  async function verifyBug(bugId: string, status: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/bugs/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bugId, status, adminNotes, awardFreeMonth }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");

      setLocalBugs(prev => prev.map(b =>
        b.id === bugId
          ? { ...b, status, admin_notes: adminNotes, free_month_awarded: awardFreeMonth && status === "verified" }
          : b
      ));
      setSelectedBug(null);
      setAdminNotes("");
      setAwardFreeMonth(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <Bug size={24} className="text-orange-400" />
          <div>
            <h1 className="text-2xl font-bold">Bug Bounty Queue</h1>
            <p className="text-sm text-gray-400">{pending.length} pending, {resolved.length} resolved</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total reports", value: localBugs.length, color: "text-white" },
            { label: "Pending review", value: pending.length, color: "text-yellow-400" },
            { label: "Free months awarded", value: localBugs.filter(b => b.free_month_awarded).length, color: "text-emerald-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pending queue */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Pending Review</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">No pending reports.</p>
          ) : (
            <div className="space-y-3">
              {pending.map(bug => (
                <div
                  key={bug.id}
                  onClick={() => { setSelectedBug(bug); setAdminNotes(bug.admin_notes ?? ""); }}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{bug.title}</p>
                      <p className="mt-1 text-xs text-gray-400 line-clamp-2">{bug.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-semibold ${SEVERITY_COLORS[bug.severity] ?? "text-gray-400"}`}>
                        {bug.severity.toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[bug.status] ?? ""}`}>
                        {bug.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    {bug.owner_business && <span>{bug.owner_business}</span>}
                    <span>{new Date(bug.created_at).toLocaleDateString("en-AU")}</span>
                    {bug.page_url && <span className="truncate max-w-[200px]">{bug.page_url}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Resolved</h2>
            <div className="space-y-2">
              {resolved.map(bug => (
                <div key={bug.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 flex items-center gap-3">
                  <span className={`text-xs font-semibold ${SEVERITY_COLORS[bug.severity] ?? ""}`}>{bug.severity}</span>
                  <p className="flex-1 text-sm text-gray-300 truncate">{bug.title}</p>
                  {bug.free_month_awarded && <Gift size={14} className="text-emerald-400 shrink-0" />}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[bug.status] ?? ""}`}>
                    {bug.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedBug && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedBug(null)}>
            <div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">{selectedBug.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedBug.owner_business ?? selectedBug.owner_id.slice(0, 8)} &bull; {new Date(selectedBug.created_at).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <button onClick={() => setSelectedBug(null)} className="text-gray-500 hover:text-white">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="rounded-lg bg-white/[0.04] p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedBug.description}
              </div>

              {selectedBug.page_url && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="truncate flex-1">{selectedBug.page_url}</span>
                  <button onClick={() => navigator.clipboard.writeText(selectedBug.page_url ?? "")} className="shrink-0">
                    <Copy size={12} />
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Admin notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  placeholder="Internal notes..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={awardFreeMonth}
                  onChange={e => setAwardFreeMonth(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Award 1 free month (bug bounty)</span>
                <Gift size={14} className="text-emerald-400" />
              </label>

              <div className="flex gap-2 flex-wrap">
                {["verified", "duplicate", "fixed", "rejected"].map(s => (
                  <button
                    key={s}
                    onClick={() => verifyBug(selectedBug.id, s)}
                    disabled={busy}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                      s === "verified" ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                      s === "rejected" ? "bg-red-500 text-white hover:bg-red-600" :
                      "border border-white/10 text-gray-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    {busy ? "..." : s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
