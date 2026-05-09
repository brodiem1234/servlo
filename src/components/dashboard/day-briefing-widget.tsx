"use client";

import { useState } from "react";

interface DayBriefingWidgetProps {
  todayJobCount: number;
  overdueCount: number;
  firstName: string;
}

export function DayBriefingWidget({ todayJobCount, overdueCount, firstName }: DayBriefingWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (briefing) return; // already fetched
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/day-briefing");
      if (!res.ok) throw new Error("Failed to fetch briefing");
      const data = await res.json();
      setBriefing(data.briefing ?? "No briefing available.");
    } catch {
      setError("Could not load briefing. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Morning Briefing</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {todayJobCount} job{todayJobCount !== 1 ? "s" : ""} today
            {overdueCount > 0 ? ` · ${overdueCount} overdue invoice${overdueCount !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
        >
          {expanded ? "Close" : "✨ Morning Briefing"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {loading && (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-3 rounded bg-[var(--bg-secondary)] w-3/4" />
              <div className="h-3 rounded bg-[var(--bg-secondary)] w-full" />
              <div className="h-3 rounded bg-[var(--bg-secondary)] w-5/6" />
              <div className="h-3 rounded bg-[var(--bg-secondary)] w-2/3" />
            </div>
          )}
          {error && !loading && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {briefing && !loading && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] dark:border-blue-900/30 dark:bg-blue-950/20 whitespace-pre-wrap">
              {briefing}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
