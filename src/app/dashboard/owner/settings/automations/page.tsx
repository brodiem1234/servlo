"use client";

import { useEffect, useState } from "react";

type Automation = {
  id: string;
  trigger_status: string;
  action_type: "email" | "sms";
  email_subject: string | null;
  message_body: string;
  is_active: boolean;
};

const JOB_STATUSES = ["scheduled", "in_progress", "completed", "invoiced", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  invoiced: "Invoiced",
  cancelled: "Cancelled",
};

const DEFAULT_BODY: Record<string, string> = {
  scheduled: "Hi {client_name}, your job \"{job_title}\" has been scheduled. We look forward to seeing you!",
  in_progress: "Hi {client_name}, we have started work on \"{job_title}\" today.",
  completed: "Hi {client_name}, we have completed \"{job_title}\". Thank you for choosing us!",
  invoiced: "Hi {client_name}, an invoice for \"{job_title}\" has been sent. Please check your email.",
  cancelled: "Hi {client_name}, your booking for \"{job_title}\" has been cancelled. Please contact us if you have any questions.",
};

const empty = {
  trigger_status: "completed",
  action_type: "email" as "email" | "sms",
  email_subject: "Job update: {job_title}",
  message_body: DEFAULT_BODY["completed"],
  is_active: true,
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/automations")
      .then((r) => r.json())
      .then((d) => setAutomations(d.automations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setShowForm(true);
  };

  const openEdit = (a: Automation) => {
    setEditing(a);
    setForm({ trigger_status: a.trigger_status, action_type: a.action_type, email_subject: a.email_subject ?? "", message_body: a.message_body, is_active: a.is_active });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/automations/${editing.id}` : "/api/automations";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Save failed");
      const d = await res.json();
      if (editing) {
        setAutomations((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } : a));
      } else {
        setAutomations((prev) => [...prev, { id: d.id, ...form }]);
      }
      showToast(editing ? "Automation updated" : "Automation created");
      setShowForm(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      showToast("Deleted");
    }
  };

  const handleToggle = async (a: Automation) => {
    const res = await fetch(`/api/automations/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, is_active: !a.is_active }),
    });
    if (res.ok) {
      setAutomations((prev) => prev.map((x) => x.id === a.id ? { ...x, is_active: !x.is_active } : x));
    }
  };

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

  return (
    <section className="space-y-6 max-w-3xl">
      <div>
        <a href="/dashboard/owner/settings" className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <span>←</span> Back to Settings
        </a>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Job Stage Automations</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Send automatic emails or SMS to clients when a job reaches a certain status.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
        <p className="font-medium text-[var(--text-primary)] mb-1">Template variables</p>
        <code className="text-xs">{"{job_title}"}</code> · <code className="text-xs">{"{client_name}"}</code> · <code className="text-xs">{"{address}"}</code> · <code className="text-xs">{"{scheduled_date}"}</code> · <code className="text-xs">{"{status}"}</code>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
      ) : (
        <>
          <div className="space-y-3">
            {automations.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No automations configured yet.</p>
            ) : automations.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
                      {STATUS_LABELS[a.trigger_status] ?? a.trigger_status}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">→</span>
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
                      {a.action_type}
                    </span>
                    {!a.is_active && (
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-[var(--text-muted)]">
                        Paused
                      </span>
                    )}
                  </div>
                  {a.action_type === "email" && a.email_subject && (
                    <p className="mt-1 text-xs font-medium text-[var(--text-secondary)] truncate">{a.email_subject}</p>
                  )}
                  <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">{a.message_body}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(a)}
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                  >
                    {a.is_active ? "Pause" : "Resume"}
                  </button>
                  <button type="button" onClick={() => openEdit(a)} className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]">Edit</button>
                  <button type="button" onClick={() => handleDelete(a.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30">Delete</button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={openCreate} className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
            + Add Automation
          </button>
        </>
      )}

      {/* Create / Edit form modal */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">{editing ? "Edit Automation" : "New Automation"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">When status changes to</label>
                  <select className={inputCls} value={form.trigger_status} onChange={(e) => { setForm((p) => ({ ...p, trigger_status: e.target.value, message_body: DEFAULT_BODY[e.target.value] ?? p.message_body })); }}>
                    {JOB_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Send via</label>
                  <select className={inputCls} value={form.action_type} onChange={(e) => setForm((p) => ({ ...p, action_type: e.target.value as "email" | "sms" }))}>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              {form.action_type === "email" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Email subject</label>
                  <input className={inputCls} value={form.email_subject ?? ""} onChange={(e) => setForm((p) => ({ ...p, email_subject: e.target.value }))} placeholder="Job update: {job_title}" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Message body</label>
                <textarea
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                  rows={5}
                  value={form.message_body}
                  onChange={(e) => setForm((p) => ({ ...p, message_body: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto-active" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                <label htmlFor="auto-active" className="text-sm text-[var(--text-primary)]">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
