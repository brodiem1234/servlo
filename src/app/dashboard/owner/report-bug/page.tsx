"use client";

import { useState } from "react";
import { Bug, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SEVERITIES = [
  { value: "low", label: "Low", desc: "Minor issue, doesn't affect workflow", color: "text-blue-400" },
  { value: "medium", label: "Medium", desc: "Annoying but workable", color: "text-yellow-400" },
  { value: "high", label: "High", desc: "Significant impact on daily use", color: "text-orange-400" },
  { value: "critical", label: "Critical", desc: "Completely broken, data loss risk", color: "text-red-400" },
];

export default function ReportBugPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [pageUrl, setPageUrl] = useState(
    typeof window !== "undefined" ? window.location.href : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bugs/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, severity, page_url: pageUrl }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit bug report");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Bug reported!</h1>
          <p className="text-[var(--text-secondary)] mb-2">
            Thanks for helping improve SERVLO. Your report has been submitted.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-amber-300">Bug Bounty Reward</p>
            <p className="mt-1 text-xs text-amber-400/80">
              If your bug is verified by our team, you&apos;ll earn <strong className="text-amber-300">1 free month</strong> of SERVLO.
              We&apos;ll notify you by email when it&apos;s reviewed (usually within 2–3 business days).
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/owner"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Back to dashboard
            </Link>
            <button
              onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setSeverity("medium"); }}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Report another bug
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/owner"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
            <Bug size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Report a Bug</h1>
            <p className="text-sm text-[var(--text-muted)]">Help us improve SERVLO — earn 1 free month for verified bugs</p>
          </div>
        </div>

        {/* Bug bounty banner */}
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Bug Bounty Program</p>
              <p className="mt-0.5 text-xs text-amber-400/80">
                Every verified bug earns you <strong className="text-amber-300">1 free month</strong> of SERVLO
                (Solo = $29 value, Team = $79 value, Business = $149 value).
                Be specific and detailed — vague reports can&apos;t be verified.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Bug title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Invoice total doesn't update when line item is deleted"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              What went wrong? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Describe exactly what happened:
1. I went to [page]
2. I clicked/typed [action]
3. Expected: [what should have happened]
4. Actual: [what actually happened]

Include any error messages you saw.`}
              rows={7}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
              minLength={10}
              maxLength={5000}
            />
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Severity
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SEVERITIES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`rounded-lg border p-3 text-left transition ${
                    severity === s.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Page URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Page URL <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              type="text"
              value={pageUrl}
              onChange={e => setPageUrl(e.target.value)}
              placeholder="https://servlo.app/dashboard/..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition"
          >
            {submitting ? "Submitting..." : "Submit Bug Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
