interface ProfitabilityAlert {
  id: string;
  title: string;
  revenue: number;
  cost: number;
  margin: number;
  flag: string;
  completed_at: string | null;
}

interface ProfitabilityAlertsProps {
  alerts: ProfitabilityAlert[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProfitabilityAlerts({ alerts }: ProfitabilityAlertsProps) {
  const flaggedAlerts = alerts.filter((a) => a.flag !== "ok");

  return (
    <details className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 select-none">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">⚠️</span>
          <span className="font-semibold text-[var(--text-primary)]">Profitability Alerts</span>
          {flaggedAlerts.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {flaggedAlerts.length}
            </span>
          )}
        </div>
        <svg
          className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
        {flaggedAlerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <span aria-hidden="true">✅</span>
            All recent jobs are profitable
          </p>
        ) : (
          <ul className="space-y-3">
            {flaggedAlerts.map((alert) => {
              const isLoss = alert.flag === "loss";
              const marginColor = isLoss
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400";
              const badgeClass = isLoss
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

              return (
                <li
                  key={alert.id}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {alert.title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Revenue {formatCurrency(alert.revenue)} &middot; Cost {formatCurrency(alert.cost)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-sm font-semibold tabular-nums ${marginColor}`}>
                      {alert.margin.toFixed(1)}% margin
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                      {isLoss ? "Loss" : "Low margin"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
