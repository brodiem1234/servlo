"use client";

import { useState, useEffect, useCallback } from "react";

type JobEvent = {
  id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
  created_by?: string | null;
};

interface Props {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  status_changed:    { label: "Status changed",    icon: "🔄", color: "text-blue-400" },
  assigned:          { label: "Assigned",           icon: "👤", color: "text-indigo-400" },
  unassigned:        { label: "Unassigned",         icon: "👤", color: "text-slate-400" },
  scheduled:         { label: "Scheduled",          icon: "📅", color: "text-emerald-400" },
  rescheduled:       { label: "Rescheduled",        icon: "📅", color: "text-amber-400" },
  note_added:        { label: "Note added",         icon: "📝", color: "text-purple-400" },
  invoice_created:   { label: "Invoice created",    icon: "🧾", color: "text-emerald-400" },
  quote_created:     { label: "Quote created",      icon: "📋", color: "text-sky-400" },
  completed:         { label: "Completed",          icon: "✅", color: "text-emerald-400" },
  cancelled:         { label: "Cancelled",          icon: "❌", color: "text-red-400" },
  client_notified:   { label: "Client notified",    icon: "📧", color: "text-teal-400" },
  location_updated:  { label: "Location updated",   icon: "📍", color: "text-orange-400" },
  checklist_updated: { label: "Checklist updated",  icon: "☑️", color: "text-blue-400" },
  custom:            { label: "Custom note",        icon: "💬", color: "text-slate-400" },
};

function getEventMeta(type: string) {
  return EVENT_TYPE_LABELS[type] ?? { label: type.replace(/_/g, " "), icon: "📌", color: "text-slate-400" };
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function JobHistoryPanel({ jobId, jobTitle, onClose }: Props) {
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/events`);
      const json = await res.json();
      if (res.ok) setEvents(json.events ?? []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  async function addNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: "note_added", note: noteText.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add note");
      const newEvent: JobEvent = json.event ?? {
        id: crypto.randomUUID(), event_type: "note_added",
        old_value: null, new_value: null, note: noteText.trim(),
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => [newEvent, ...prev]);
      setNoteText("");
      setAdding(false);
      showToast("Note added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", false);
    } finally { setSaving(false); }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Job history: ${jobTitle}`}
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1e2433] shadow-2xl flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Job History</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xs">{jobTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdding((a) => !a)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              >
                + Add Note
              </button>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none" aria-label="Close">×</button>
            </div>
          </div>

          {/* Add note form */}
          {adding && (
            <div className="px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Add a note to this job's history…"
                autoFocus
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addNote();
                  if (e.key === "Escape") { setAdding(false); setNoteText(""); }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[var(--text-muted)]">⌘↵ to save · Esc to cancel</span>
                <div className="flex gap-2">
                  <button onClick={() => { setAdding(false); setNoteText(""); }} className="rounded px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
                  <button onClick={addNote} disabled={!noteText.trim() || saving} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-neutral-100 disabled:opacity-60">
                    {saving ? "Saving…" : "Add Note"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Events list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">Loading history…</div>
            ) : events.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-[var(--text-secondary)] font-medium text-sm">No history yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Events will appear here as the job progresses</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[37px] top-4 bottom-4 w-px bg-[var(--border)]" aria-hidden />
                <ul className="px-5 py-4 space-y-4">
                  {events.map((ev) => {
                    const meta = getEventMeta(ev.event_type);
                    return (
                      <li key={ev.id} className="flex gap-3 relative">
                        {/* Icon dot */}
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-sm z-10">
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                            <span className="text-xs text-[var(--text-muted)]">{formatRelative(ev.created_at)}</span>
                          </div>
                          {(ev.old_value || ev.new_value) && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              {ev.old_value && <span className="line-through opacity-60">{ev.old_value}</span>}
                              {ev.old_value && ev.new_value && <span>→</span>}
                              {ev.new_value && <span className="text-[var(--text-secondary)]">{ev.new_value}</span>}
                            </div>
                          )}
                          {ev.note && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] rounded-lg px-3 py-2 border border-[var(--border)]">
                              {ev.note}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[var(--border)] flex-shrink-0">
            <p className="text-[10px] text-[var(--text-muted)] text-center">
              {events.length} event{events.length !== 1 ? "s" : ""} · Showing last 50
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div role="alert" aria-live="polite" className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium text-white ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
