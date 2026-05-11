"use client";

import { useState } from "react";
import { Download, Trash2, Loader2 } from "lucide-react";

export default function PrivacySettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletionScheduled, setDeletionScheduled] = useState(false);
  const [deletionDate, setDeletionDate] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    setExportDone(false);
    try {
      const res = await fetch("/api/account/export", { method: "POST" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `servlo-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch (err) {
      setExportError(String(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleRequestDeletion() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/request-deletion", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; completesAt?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Request failed");
      setDeletionScheduled(true);
      setDeletionDate(data.completesAt ?? null);
      setDeleteDialogOpen(false);
    } catch (err) {
      setDeleteError(String(err));
    } finally {
      setDeleting(false);
    }
  }

  async function handleCancelDeletion() {
    const res = await fetch("/api/account/cancel-deletion", { method: "POST" });
    if (res.ok) {
      setDeletionScheduled(false);
      setDeletionDate(null);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary, #0f172a)" }}>Privacy &amp; Data</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary, #64748b)" }}>
          You own your data. Export it anytime, or delete your account with a 30-day grace period.
        </p>
      </div>

      {/* Export section */}
      <section className="rounded-xl border p-5 space-y-3" style={{ background: "var(--bg-card, #fff)" }}>
        <h3 className="font-semibold text-base" style={{ color: "var(--text-primary, #0f172a)" }}>
          Download all my data
        </h3>
        <p className="text-sm" style={{ color: "var(--text-secondary, #64748b)" }}>
          Get a complete copy of all your SERVLO data — clients, jobs, invoices, quotes, employees, and more — anytime.
        </p>
        {exportDone && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
            Export downloaded successfully.
          </div>
        )}
        {exportError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            Export failed: {exportError}
          </div>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Exporting..." : "Download my data"}
        </button>
      </section>

      {/* Deletion section */}
      <section className="rounded-xl border border-red-200 p-5 space-y-3" style={{ background: "#fff5f5" }}>
        <h3 className="font-semibold text-base text-red-700">Delete my account</h3>
        {deletionScheduled ? (
          <>
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <strong>Account deletion scheduled.</strong>{" "}
              {deletionDate && (
                <>Your account will be permanently deleted on{" "}
                  <strong>{new Date(deletionDate).toLocaleDateString("en-AU", { dateStyle: "long" })}</strong>.
                </>
              )}{" "}
              Log in anytime before then to cancel.
            </div>
            <button
              onClick={handleCancelDeletion}
              className="text-sm underline text-red-600 hover:text-red-800"
            >
              Cancel deletion request
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-red-600">
              Once you delete your account, all your data will be permanently removed after 30 days.
              You can cancel within that window.
            </p>
            {!deleteDialogOpen ? (
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete my account
              </button>
            ) : (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700">Are you sure?</p>
                <p className="text-sm text-red-600">
                  Your account will be scheduled for deletion in 30 days. You can cancel anytime before then.
                </p>
                {deleteError && (
                  <p className="text-sm text-red-600">Error: {deleteError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleRequestDeletion}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {deleting ? "Scheduling..." : "Yes, delete my account"}
                  </button>
                  <button
                    onClick={() => setDeleteDialogOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
