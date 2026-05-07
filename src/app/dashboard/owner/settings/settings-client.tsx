"use client";

import { useState } from "react";

// ── Notification preferences ────────────────────────────────────────────────

type NotificationPrefs = {
  invoice_paid: boolean;
  new_job_created: boolean;
  job_completed: boolean;
  quote_accepted: boolean;
  overdue_invoice_reminder: boolean;
  overdue_invoice_frequency: 7 | 14 | 30;
  trial_ending_reminder: boolean;
};

type NotificationsFormProps = {
  initialPrefs: NotificationPrefs;
  saveAction: (prefs: NotificationPrefs) => Promise<void>;
};

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-[var(--accent-color)]" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function NotificationsForm({ initialPrefs, saveAction }: NotificationsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveAction(prefs);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Toggle
        checked={prefs.invoice_paid}
        onChange={(v) => set("invoice_paid", v)}
        label="Invoice paid notification"
      />
      <Toggle
        checked={prefs.new_job_created}
        onChange={(v) => set("new_job_created", v)}
        label="New job created notification"
      />
      <Toggle
        checked={prefs.job_completed}
        onChange={(v) => set("job_completed", v)}
        label="Job completed notification"
      />
      <Toggle
        checked={prefs.quote_accepted}
        onChange={(v) => set("quote_accepted", v)}
        label="Quote accepted notification"
      />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-[var(--text-primary)]">Overdue invoice reminder</span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.overdue_invoice_reminder}
            onClick={() => set("overdue_invoice_reminder", !prefs.overdue_invoice_reminder)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              prefs.overdue_invoice_reminder ? "bg-[var(--accent-color)]" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                prefs.overdue_invoice_reminder ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {prefs.overdue_invoice_reminder ? (
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--text-secondary)]">Send reminder after</label>
            <select
              value={prefs.overdue_invoice_frequency}
              onChange={(e) => set("overdue_invoice_frequency", Number(e.target.value) as 7 | 14 | 30)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        ) : null}
      </div>
      <Toggle
        checked={prefs.trial_ending_reminder}
        onChange={(v) => set("trial_ending_reminder", v)}
        label="Trial ending reminder"
      />
      <div className="pt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save notification preferences"}
        </button>
        {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}

// ── Export buttons ──────────────────────────────────────────────────────────

export function ExportButtons() {
  const [loading, setLoading] = useState<"clients" | "invoices" | "jobs" | null>(null);

  function triggerDownload(href: string) {
    const a = document.createElement("a");
    a.href = href;
    a.click();
  }

  async function exportData(type: "clients" | "invoices" | "jobs") {
    setLoading(type);
    try {
      triggerDownload(`/api/export/${type}`);
    } finally {
      // Small delay so the button doesn't flash
      window.setTimeout(() => setLoading(null), 1500);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loading === "clients"}
        onClick={() => exportData("clients")}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "clients" ? "Exporting…" : "Export clients as CSV"}
      </button>
      <button
        type="button"
        disabled={loading === "invoices"}
        onClick={() => exportData("invoices")}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "invoices" ? "Exporting…" : "Export invoices as CSV"}
      </button>
      <button
        type="button"
        disabled={loading === "jobs"}
        onClick={() => exportData("jobs")}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "jobs" ? "Exporting…" : "Export jobs as CSV"}
      </button>
    </div>
  );
}

// ── Delete account ──────────────────────────────────────────────────────────

type DeleteAccountProps = {
  deleteAction: () => Promise<void>;
};

export function DeleteAccountSection({ deleteAction }: DeleteAccountProps) {
  const [input, setInput] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = input.trim() === "DELETE";

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">This action is permanent and cannot be undone.</p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
          All your business data — clients, jobs, quotes, invoices, employees, and account information — will be permanently deleted.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE"
          className="h-10 w-full max-w-xs rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!confirmed || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Permanently delete account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setInput("");
            setError(null);
          }}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Demo data confirm buttons ───────────────────────────────────────────────

type DemoButtonProps = {
  resetAction: () => Promise<void>;
  removeAction: () => Promise<void>;
};

export function DemoDataButtons({ resetAction, removeAction }: DemoButtonProps) {
  const [confirming, setConfirming] = useState<"reset" | "remove" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  if (confirming === "reset") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-secondary)]">This will remove existing demo rows and insert a fresh set. Your real data is not affected.</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(resetAction)}
            className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {busy ? "Resetting…" : "Confirm reset"}
          </button>
          <button type="button" onClick={() => setConfirming(null)} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]">Cancel</button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (confirming === "remove") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-secondary)]">This will permanently delete all demo-tagged records. Your real data is not affected.</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(removeAction)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Removing…" : "Confirm remove"}
          </button>
          <button type="button" onClick={() => setConfirming(null)} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]">Cancel</button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <button
        type="button"
        onClick={() => setConfirming("reset")}
        className="rounded border border-[var(--accent-color)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--accent-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,var(--bg-card))]"
      >
        Reset demo data
      </button>
      <button
        type="button"
        onClick={() => setConfirming("remove")}
        className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
      >
        Clear all demo data
      </button>
    </div>
  );
}
