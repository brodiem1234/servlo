"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ChurnClient {
  id: string;
  full_name: string | null;
  company_name: string | null;
  churn_score: number;
  risk_level: "high" | "medium" | "low";
  days_since_last_job: number | null;
}

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  high: {
    label: "High risk",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  medium: {
    label: "Medium risk",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  low: {
    label: "Low risk",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

export function ChurnRiskWidget() {
  const [expanded, setExpanded] = useState(false);
  const [clients, setClients] = useState<ChurnClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts/churn-risk");
      if (!res.ok) throw new Error("Failed to load churn data");
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch {
      setError("Could not load churn risk data. Please try again.");
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }

  function handleToggle() {
    if (!expanded && !fetched) {
      load();
    }
    setExpanded((prev) => !prev);
  }

  const atRiskClients = clients.filter((c) => c.risk_level === "high" || c.risk_level === "medium");

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🔴</span>
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Churn Risk</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Clients who may be slipping away
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)]"
        >
          {expanded ? "Hide" : "Show churn risks"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {loading && (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-10 rounded-lg bg-[var(--bg-secondary)]" />
              <div className="h-10 rounded-lg bg-[var(--bg-secondary)]" />
              <div className="h-10 rounded-lg bg-[var(--bg-secondary)]" />
            </div>
          )}
          {error && !loading && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!loading && fetched && atRiskClients.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <span aria-hidden="true">✅</span>
              No churn risk detected
            </p>
          )}
          {!loading && atRiskClients.length > 0 && (
            <ul className="space-y-2">
              {atRiskClients.map((client) => {
                const badge = RISK_BADGE[client.risk_level] ?? RISK_BADGE.low;
                const displayName =
                  client.full_name ??
                  client.company_name ??
                  "Unknown Client";

                return (
                  <li
                    key={client.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {displayName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {client.days_since_last_job !== null
                          ? `${client.days_since_last_job} days since last job`
                          : "No jobs on record"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <Link
                        href={`/dashboard/owner/clients/${client.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
