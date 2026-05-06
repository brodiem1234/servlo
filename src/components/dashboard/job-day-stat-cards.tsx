"use client";

type DayStat = { count: number; hours: number };
type Props = { todayKeyIso: string; tomorrowKeyIso: string; today: DayStat; tomorrow: DayStat };

function fmtHours(h: number) {
  if (!Number.isFinite(h) || h <= 0) return "0 h";
  const rounded = Math.round(h * 10) / 10;
  return `${rounded} h`;
}

export default function JobDayStatCards({ todayKeyIso, tomorrowKeyIso, today, tomorrow }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={`/dashboard/schedule?date=${encodeURIComponent(todayKeyIso)}`}
        className="min-w-[140px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:border-[color-mix(in_srgb,var(--accent-color)_45%,var(--border))]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Jobs today</p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{today.count}</p>
        <p className="text-xs text-[var(--text-secondary)]">{fmtHours(today.hours)} scheduled</p>
      </a>
      <a
        href={`/dashboard/schedule?date=${encodeURIComponent(tomorrowKeyIso)}`}
        className="min-w-[140px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:border-[color-mix(in_srgb,var(--accent-color)_45%,var(--border))]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Jobs tomorrow</p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{tomorrow.count}</p>
        <p className="text-xs text-[var(--text-secondary)]">{fmtHours(tomorrow.hours)} scheduled</p>
      </a>    </div>
  );
}
