"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistItem } from "@/lib/industries";

export type RingTask = ChecklistItem & { done: boolean };

function taskKey(item: ChecklistItem) {
  return `${item.href}::${item.label}`;
}

export default function GettingStartedRing({ tasks }: { tasks: RingTask[] }) {
  const [dismissed, setDismissed] = useState<Record<string, true>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("servlo-checklist-dismiss");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") setDismissed(parsed as Record<string, true>);
    } catch {
      /* ignore */
    }
  }, []);

  function persistDismiss(next: Record<string, true>) {
    setDismissed(next);
    try {
      window.localStorage.setItem("servlo-checklist-dismiss", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.optional) return true;
      return !dismissed[taskKey(t)];
    });
  }, [tasks, dismissed]);

  const total = visibleTasks.length;
  const completed = visibleTasks.filter((t) => t.done).length;
  const fraction = total > 0 ? completed / total : 0;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fraction);

  return (
    <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="relative grid h-28 w-28 place-items-center">
            <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
              <circle cx="50" cy="50" r={r} stroke="var(--border)" strokeWidth="10" fill="none" />
              <circle
                cx="50"
                cy="50"
                r={r}
                stroke="var(--accent-color)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="pointer-events-none absolute text-lg font-bold text-[var(--text-primary)]">
              {completed}/{total}
            </span>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)]">Getting started</p>
        </div>
        <div className="min-w-[220px] flex-1 space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your checklist</h2>
          <p className="text-xs text-[var(--text-muted)]">Industry-focused tasks plus core SERVLO setup.</p>
          <ul className="mt-2 space-y-2 text-sm">
            {visibleTasks.map((item) => {
              const key = taskKey(item);
              const incompleteOptional = Boolean(item.optional) && !item.done;
              return (
                <li
                  key={key}
                  className={`flex items-start gap-2 rounded-lg border border-[var(--border)] px-3 py-2 ${
                    item.done ? "bg-emerald-500/5" : incompleteOptional ? "opacity-70" : ""
                  }`}
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--bg-primary)] text-xs">
                    {item.done ? <span className="text-emerald-600">✓</span> : <span className="text-[var(--text-muted)]">○</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a href={item.href} className="dashboard-text-link font-medium text-[var(--text-primary)]">
                      {item.label}
                    </a>
                  </div>
                  {item.optional && !item.done ? (
                    <button
                      type="button"
                      title="Dismiss optional tip"
                      className="shrink-0 rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-primary)]"
                      onClick={() => persistDismiss({ ...dismissed, [key]: true })}
                    >
                      ✕
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </article>
  );
}
