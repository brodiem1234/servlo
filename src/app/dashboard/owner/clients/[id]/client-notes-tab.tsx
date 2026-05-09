"use client";

import { useState, useEffect, useRef } from "react";

type ClientNote = {
  id: string;
  note: string;
  created_at: string;
  created_by: string | null;
};

type Props = {
  clientId: string;
};

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-AU");
}

export default function ClientNotesTab({ clientId }: Props) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/clients/${clientId}/notes`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => setError("Failed to load notes."))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add note.");
      } else {
        setNotes((prev) => [data.note, ...prev]);
        setDraft("");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await fetch(`/api/clients/${clientId}/notes/${noteId}`, { method: "DELETE" });
    } catch {
      // best-effort; UI already updated
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm space-y-4">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">Client Notes</h3>

      {/* Add note form */}
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Add a note… (Cmd/Ctrl+Enter to submit)"
          disabled={submitting}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-60"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={submitting || !draft.trim()}
            className="inline-flex h-9 items-center rounded-lg bg-[var(--accent-color)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition"
          >
            {submitting ? "Adding…" : "Add Note"}
          </button>
          {error ? <span className="text-sm text-red-500">{error}</span> : null}
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No notes yet. Add one above.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">{n.note}</p>
                <p className="text-xs text-[var(--text-muted)]">{relativeDate(n.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(n.id)}
                className="shrink-0 self-start rounded p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition"
                aria-label="Delete note"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
