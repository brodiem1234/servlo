"use client";

import { useEffect, useState } from "react";

interface UsageStats {
  used: number;
  limit: number;
  plan: string;
  resetDate: string;
  allowed: boolean;
  isSoftCap: boolean;
}

export function AIUsageMeter() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/usage-stats")
      .then((r) => r.json())
      .then((data: UsageStats) => setStats(data))
      .catch(() => {/* swallow */})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats || stats.limit === 0) return null;

  const pct = Math.min(100, Math.round((stats.used / stats.limit) * 100));
  const isAtLimit = !stats.allowed;
  const isWarning = pct >= 80 && !isAtLimit;
  const resetDate = new Date(stats.resetDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="rounded-lg border p-3 text-sm" style={{ background: "var(--bg-card, #fff)" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-xs" style={{ color: "var(--text-secondary, #64748b)" }}>
          AI Uses This Month
        </span>
        {isAtLimit && (
          <a
            href="/dashboard/owner/settings?tab=billing"
            className="text-xs font-semibold text-red-600 underline"
          >
            Upgrade
          </a>
        )}
        {isWarning && (
          <a
            href="/dashboard/owner/settings?tab=billing"
            className="text-xs font-semibold text-amber-600 underline"
          >
            Upgrade
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-primary, #0f172a)" }}>
          {stats.used} / {stats.limit}
        </span>
      </div>

      {isAtLimit && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">
          Limit reached. Upgrade to continue.
        </p>
      )}
      {isWarning && (
        <p className="mt-1.5 text-xs text-amber-600">
          Running low — resets {resetDate}.
        </p>
      )}
      {!isAtLimit && !isWarning && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary, #94a3b8)" }}>
          Resets {resetDate}
        </p>
      )}
    </div>
  );
}
