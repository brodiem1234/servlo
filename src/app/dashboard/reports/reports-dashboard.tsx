"use client";

import { useState, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type MonthlyRevenue = {
  month: string;
  revenue: number;
};

export type JobStats = {
  total: number;
  completed: number;
  cancelled: number;
  scheduled: number;
  completionRate: number;
};

export type TopClient = {
  name: string;
  revenue: number;
  jobCount: number;
};

export type ServiceMixItem = {
  type: string;
  count: number;
};

type Props = {
  monthlyRevenue: MonthlyRevenue[];
  jobStats: JobStats;
  topClients: TopClient[];
  avgJobValue: number;
  serviceMix: ServiceMixItem[];
  totalRevenue: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAud(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function capitalise(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── SVG Revenue Bar Chart ──────────────────────────────────────────────────────

function SvgRevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  if (data.length === 0 || data.every((d) => d.revenue === 0)) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
        No revenue data yet
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const paddingLeft = 64;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 32;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const barWidth = (chartW / data.length) * 0.6;
  const barGap = chartW / data.length;

  // Y-axis ticks (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: pct * maxRevenue,
    y: paddingTop + chartH * (1 - pct),
  }));

  return (
    <div className="relative w-full" style={{ height: 200 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        role="img"
        aria-label="Monthly revenue bar chart"
      >
        <title>Monthly revenue — last 6 months</title>
        {/* Y-axis grid lines */}
        {yTicks.map((t) => (
          <g key={t.value}>
            <line
              x1={paddingLeft}
              y1={t.y}
              x2={width - paddingRight}
              y2={t.y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--text-muted)"
            >
              {t.value >= 1000
                ? `$${(t.value / 1000).toFixed(0)}k`
                : `$${t.value.toFixed(0)}`}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.revenue / maxRevenue) * chartH;
          const x = paddingLeft + i * barGap + (barGap - barWidth) / 2;
          const y = paddingTop + chartH - barH;
          return (
            <g key={d.month}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                fill="var(--accent-color)"
                rx={3}
                ry={3}
                opacity={0.9}
                className="cursor-pointer transition-opacity hover:opacity-100"
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget as SVGRectElement).closest("svg")!.getBoundingClientRect();
                  const svgX = ((x + barWidth / 2) / width) * rect.width + rect.left;
                  const svgY = (y / height) * rect.height + rect.top;
                  setTooltip({ x: svgX, y: svgY, label: d.month, value: d.revenue });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-muted)"
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 8, top: tooltip.y - 8, transform: "translateY(-100%)" }}
        >
          <p className="font-semibold text-[var(--text-primary)]">{tooltip.label}</p>
          <p className="text-[var(--text-secondary)]">{formatAud(tooltip.value)}</p>
        </div>
      )}
    </div>
  );
}

// ── Job Status Horizontal Bar ─────────────────────────────────────────────────

function JobStatusBar({ stats }: { stats: JobStats }) {
  const total = stats.total;
  if (total === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No jobs in this period.</p>;
  }

  const segments = [
    { label: "Completed", count: stats.completed, color: "#10B981" },
    { label: "Scheduled", count: stats.scheduled, color: "#3B82F6" },
    { label: "Cancelled", count: stats.cancelled, color: "#EF4444" },
    {
      label: "Other",
      count: total - stats.completed - stats.scheduled - stats.cancelled,
      color: "#94A3B8",
    },
  ].filter((s) => s.count > 0);

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-full" role="img" aria-label="Job status breakdown">
        <title>Job status breakdown</title>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${(seg.count / total) * 100}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${seg.count} (${((seg.count / total) * 100).toFixed(0)}%)`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}: <span className="font-semibold text-[var(--text-primary)]">{seg.count}</span>
            <span className="text-[var(--text-muted)]">({((seg.count / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Service Mix SVG Donut ─────────────────────────────────────────────────────

const SERVICE_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

function ServiceMixDonut({ data }: { data: ServiceMixItem[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No jobs in this period.</p>;
  }

  const total = filtered.reduce((s, d) => s + d.count, 0);
  const cx = 90;
  const cy = 90;
  const outerR = 80;
  const innerR = 50;

  // Build arc paths
  let startAngle = -Math.PI / 2;
  const slices = filtered.map((item, i) => {
    const pct = item.count / total;
    const angle = pct * 2 * Math.PI;
    const endAngle = startAngle + angle;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");

    const result = { path, color: SERVICE_COLORS[i % SERVICE_COLORS.length], item, pct };
    startAngle = endAngle;
    return result;
  });

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={180} height={180} role="img" aria-label="Service mix donut chart">
        <title>Service mix</title>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.9}>
            <title>{`${capitalise(s.item.type)}: ${s.item.count} (${(s.pct * 100).toFixed(0)}%)`}</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
          Total
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={18} fontWeight="bold" fill="var(--text-primary)">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span>{capitalise(s.item.type)}</span>
            <span className="font-semibold text-[var(--text-primary)]">{s.item.count}</span>
            <span className="text-[var(--text-muted)]">({(s.pct * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

// ── Date Range Selector ───────────────────────────────────────────────────────

const DATE_RANGES = ["Last 30d", "Last 90d", "Last 6m", "Last 12m"] as const;
type DateRange = (typeof DATE_RANGES)[number];

// ── Export CSV ────────────────────────────────────────────────────────────────

function buildCsv(
  monthlyRevenue: MonthlyRevenue[],
  topClients: TopClient[],
  jobStats: JobStats,
  totalRevenue: number,
  avgJobValue: number
): string {
  const lines: string[] = [];

  lines.push("SERVLO Business Report");
  lines.push(`Generated,${new Date().toLocaleDateString("en-AU")}`);
  lines.push("");

  lines.push("SUMMARY");
  lines.push(`Total Revenue,${totalRevenue}`);
  lines.push(`Jobs Completed,${jobStats.completed}`);
  lines.push(`Avg Job Value,${avgJobValue.toFixed(2)}`);
  lines.push(`Completion Rate,${jobStats.completionRate.toFixed(1)}%`);
  lines.push("");

  lines.push("MONTHLY REVENUE");
  lines.push("Month,Revenue (AUD)");
  for (const m of monthlyRevenue) {
    lines.push(`${m.month},${m.revenue}`);
  }
  lines.push("");

  lines.push("TOP CLIENTS");
  lines.push("Client,Revenue (AUD),Jobs,Avg Job Value (AUD)");
  for (const c of topClients) {
    const avg = c.jobCount > 0 ? (c.revenue / c.jobCount).toFixed(2) : "0.00";
    lines.push(`"${c.name}",${c.revenue},${c.jobCount},${avg}`);
  }

  return lines.join("\n");
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `servlo-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReportsDashboard({
  monthlyRevenue,
  jobStats,
  topClients,
  avgJobValue,
  serviceMix,
  totalRevenue,
}: Props) {
  const [activeRange, setActiveRange] = useState<DateRange>("Last 6m");

  function handleExport() {
    const csv = buildCsv(monthlyRevenue, topClients, jobStats, totalRevenue, avgJobValue);
    downloadCsv(csv);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Business Reports</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Revenue, jobs, and client performance at a glance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range selector — visual only */}
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-0.5 text-xs font-medium">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  activeRange === r
                    ? "bg-[var(--accent-color)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1v8M4 6l3 3 3-3M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatAud(totalRevenue)}
          sub="from paid invoices"
        />
        <KpiCard
          label="Jobs Completed"
          value={String(jobStats.completed)}
          sub={`of ${jobStats.total} total (last 90d)`}
        />
        <KpiCard
          label="Avg Job Value"
          value={avgJobValue > 0 ? formatAud(avgJobValue) : "—"}
          sub="from completed jobs"
        />
        <KpiCard
          label="Completion Rate"
          value={jobStats.total > 0 ? `${jobStats.completionRate.toFixed(0)}%` : "—"}
          sub={`${jobStats.cancelled} cancelled`}
        />
      </div>

      {/* Revenue bar chart */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Revenue — last 6 months
        </h2>
        <SvgRevenueChart data={monthlyRevenue} />
      </div>

      {/* Job status + service mix */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Job status breakdown
          </h2>
          <JobStatusBar stats={jobStats} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Service mix — last 90 days
          </h2>
          <ServiceMixDonut data={serviceMix} />
        </div>
      </div>

      {/* Top clients table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Top clients by revenue
        </h2>
        {topClients.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--text-muted)]">
            No paid invoices with client data yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Top clients by revenue">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <th scope="col" className="pb-2 pr-3 w-8">#</th>
                  <th scope="col" className="pb-2 pr-3">Client</th>
                  <th scope="col" className="pb-2 pr-3 text-right">Revenue</th>
                  <th scope="col" className="pb-2 pr-3 text-right">Jobs</th>
                  <th scope="col" className="pb-2 text-right">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => {
                  const avg = c.jobCount > 0 ? c.revenue / c.jobCount : 0;
                  return (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="py-2 pr-3 text-[var(--text-muted)]">{i + 1}</td>
                      <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-[var(--text-primary)]">
                        {formatAud(c.revenue)}
                      </td>
                      <td className="py-2 pr-3 text-right text-[var(--text-secondary)]">{c.jobCount}</td>
                      <td className="py-2 text-right text-[var(--text-secondary)]">
                        {avg > 0 ? formatAud(avg) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
