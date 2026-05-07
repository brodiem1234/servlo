"use client";

type DayRevenue = {
  label: string;
  value: number;
};

type Props = {
  data: DayRevenue[];
};

function formatCurrencyShort(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

function getTodayMonIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0 … Sun=6
}

export default function WeeklyRevenueChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 120;
  const barMaxHeight = 90;
  const todayIdx = getTodayMonIndex();

  return (
    <div className="mt-4">
      <div className="flex items-end justify-between gap-2" style={{ height: `${chartHeight}px` }}>
        {data.map((day, i) => {
          const barHeight = Math.max(4, Math.round((day.value / max) * barMaxHeight));
          const isToday = i === todayIdx;
          return (
            <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
              {day.value > 0 ? (
                <span className="text-[10px] font-medium text-[var(--text-muted)]">
                  {formatCurrencyShort(day.value)}
                </span>
              ) : (
                <span className="text-[10px] text-transparent select-none">$0</span>
              )}
              <div className="flex w-full items-end justify-center">
                <div
                  className="w-full max-w-[40px] rounded-t transition-all"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: isToday
                      ? "var(--accent-color)"
                      : "color-mix(in srgb, var(--accent-color) 40%, transparent)"
                  }}
                  title={`${day.label}: ${formatCurrencyShort(day.value)}`}
                />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isToday ? "var(--accent-color)" : "var(--text-muted)" }}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
