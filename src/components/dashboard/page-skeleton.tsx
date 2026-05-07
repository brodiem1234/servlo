type Props = {
  rows?: number;
  cards?: number;
  showHeader?: boolean;
};

/**
 * Generic pulsing skeleton for dashboard pages.
 * Usage: <DashboardPageSkeleton cards={4} rows={5} showHeader />
 */
export function DashboardPageSkeleton({ rows = 5, cards = 0, showHeader = true }: Props) {
  return (
    <div className="animate-pulse space-y-6 px-4 py-5 md:px-6">
      {showHeader ? (
        <div className="space-y-2">
          <div className="h-8 w-52 max-w-[60%] rounded-md bg-slate-700/50" />
          <div className="h-4 w-80 max-w-[80%] rounded bg-slate-700/50" />
        </div>
      ) : null}

      {cards > 0 ? (
        <div className={`grid gap-3 sm:grid-cols-2 ${cards >= 4 ? "lg:grid-cols-4" : cards === 3 ? "lg:grid-cols-3" : ""}`}>
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-slate-700/20 p-4">
              <div className="h-3 w-24 rounded bg-slate-700/50" />
              <div className="mt-3 h-7 w-32 rounded bg-slate-700/50" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--border)] bg-slate-700/20 p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="h-10 rounded bg-slate-700/50"
              style={{ width: `${100 - (i % 3) * 8}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
