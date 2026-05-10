"use client";

import { useState } from "react";
import { addOwnerTask, deleteOwnerTask, toggleOwnerTask } from "@/app/dashboard/owner/owner-task-actions";

export type OwnerTaskRow = { id: string; title: string; done: boolean };

export default function OwnerSidebarTodos({ initialTasks }: { initialTasks: OwnerTaskRow[] }) {
  const [tasks, setTasks] = useState<OwnerTaskRow[]>(initialTasks);
  const [title, setTitle] = useState("");
  const pending = tasks.filter((t) => !t.done);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const tempId = `temp-${Date.now()}`;
    setTasks((prev) => [...prev, { id: tempId, title: trimmed, done: false }]);
    setTitle("");
    const fd = new FormData();
    fd.set("title", trimmed);
    await addOwnerTask(fd);
    setTasks((prev) => prev.filter((t) => t.id !== tempId));
  }

  async function onToggle(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: true } : t));
    const fd = new FormData();
    fd.set("id", id);
    await toggleOwnerTask(fd);
  }

  async function onDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const fd = new FormData();
    fd.set("id", id);
    await deleteOwnerTask(fd);
  }

  return (
    <div className="mt-6 border-t border-[var(--sidebar-divider)] pt-4">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--sidebar-text)] opacity-80">
        Quick tasks
      </p>
      <form onSubmit={onAdd} className="mt-2 flex gap-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-md border border-[var(--sidebar-divider)] bg-[color-mix(in_srgb,var(--sidebar-bg)_88%,white)] px-2 py-1.5 text-xs text-[var(--sidebar-text)] placeholder:text-[var(--sidebar-text)] placeholder:opacity-55 dark:bg-[color-mix(in_srgb,var(--sidebar-bg)_75%,#0f172a)]"
        />
        <button type="submit" className="shrink-0 rounded-md bg-[var(--accent-color)] px-2 py-1 text-xs font-semibold text-white">
          +
        </button>
      </form>
      <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
        {pending.length === 0 ? (
          <li className="px-1 py-1 text-[var(--sidebar-text)] opacity-60">Nothing here yet.</li>
        ) : (
          pending.map((t) => (
            <li key={t.id} className="flex items-start gap-2 rounded-md px-1 py-1 hover:bg-white/5">
              <button
                type="button"
                onClick={() => onToggle(t.id)}
                className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-[var(--sidebar-divider)] text-[10px]"
                aria-label="Mark done"
              >
                ○
              </button>
              <span className="min-w-0 flex-1 leading-snug text-[var(--sidebar-text)]">{t.title}</span>
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                className="text-[10px] text-[var(--sidebar-text)] opacity-55 hover:opacity-100"
                aria-label="Remove task"
              >
                ✕
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
