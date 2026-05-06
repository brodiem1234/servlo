type Props = {
  values: number[];
  /** ISO labels for each bucket (same length as values), e.g. Mon Tue … */
  labels?: string[];
};

/** Minimal bar sparkline for dashboard revenue (last 7 days). */
export default function RevenueSparkline({ values, labels }: Props) {
  const safe = values.length ? values.map((v) => Number(v) || 0) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const barMaxPx = 48;

  return (
    <div className="mt-3">
      <div className="flex h-14 items-end justify-between gap-1">
        {safe.map((v, i) => {
          const h = Math.max(4, Math.round((v / max) * barMaxPx));
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[32px] rounded-t bg-[#0db8c8]/85 dark:bg-[#0db8c8]/70"
                style={{ height: `${h}px` }}
                title={`$${v.toFixed(0)}`}
              />
            </div>
          );
        })}
      </div>
      {labels && labels.length === safe.length ? (
        <div className="mt-1 flex justify-between gap-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {labels.map((lb, i) => (
            <span key={i} className="min-w-0 flex-1 truncate text-center">
              {lb}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
