"use client";

import { useEffect, useState } from "react";

interface MaterialAlert {
  id: string;
  name: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  unit: string;
}

interface ApiResponse {
  alerts: MaterialAlert[];
  stub: boolean;
}

function QuantityBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
        Out of stock
      </span>
    );
  }
  if (qty <= threshold) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        {qty} {qty === 1 ? "left" : "remaining"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
      {qty} in stock
    </span>
  );
}

export function MaterialsReorderWidget() {
  const [alerts, setAlerts] = useState<MaterialAlert[]>([]);
  const [stub, setStub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/alerts/materials-reorder");
        if (!res.ok) throw new Error("Failed to load materials");
        const data = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setAlerts(data.alerts ?? []);
          setStub(data.stub ?? false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  const pendingCount = visibleAlerts.length;

  function markOrdered(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <span aria-hidden>📦</span> Materials Reorder Alerts
        </span>

        <span className="flex items-center gap-2">
          {!loading && pendingCount > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              {pendingCount} {pendingCount === 1 ? "item" : "items"} need reorder
            </span>
          )}
          {!loading && pendingCount === 0 && !error && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">All stocked</span>
          )}
          <svg
            className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="h-10 rounded-lg bg-[var(--bg-secondary)]" />
              ))}
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && stub && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
              Connect your inventory to get real stock alerts
            </div>
          )}

          {!loading && !error && pendingCount === 0 && (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              ✅ All materials stocked
            </p>
          )}

          {!loading && !error && pendingCount > 0 && (
            <ul className="space-y-2">
              {visibleAlerts.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Threshold: {item.reorder_threshold} {item.unit}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <QuantityBadge qty={item.quantity_on_hand} threshold={item.reorder_threshold} />
                    <button
                      type="button"
                      onClick={() => markOrdered(item.id)}
                      className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      Mark Ordered
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
