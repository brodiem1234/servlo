"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

type MonthBucket = { month: string; revenue: number; jobs: number };
type JobStatusBreakdown = { status: string; count: number };
type TopClient = { name: string; revenue: number };

type KPIs = {
  revenueTotal: number;
  jobsCompleted: number;
  avgJobValue: number;
  newClients: number;
  revenueChange: number | null;
  jobsChange: number | null;
};

type Props = {
  monthly12: MonthBucket[];
  statusBreakdown: JobStatusBreakdown[];
  topClients: TopClient[];
  kpis: KPIs;
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#22C55E",
  in_progress: "#F59E0B",
  scheduled: "#3B82F6",
  cancelled: "#EF4444",
  pending: "#94A3B8",
};

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function formatCurrencyFull(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
}

function ChangeTag({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {positive ? "+" : ""}{value.toFixed(0)}% vs prev period
    </span>
  );
}

export function ReportsClient({ monthly12, statusBreakdown, topClients, kpis }: Props) {
  const [period, setPeriod] = useState<"3m" | "6m" | "12m">("6m");

  const periodMonths = period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const chartData = useMemo(() => {
    return monthly12.slice(-periodMonths);
  }, [monthly12, periodMonths]);

  const totalStatusCount = statusBreakdown.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Business performance — real data</p>
        </div>
        <div className="flex gap-2">
          {(["3m", "6m", "12m"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p
                  ? "bg-[var(--accent-color)] text-white"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrencyFull(kpis.revenueTotal),
            change: kpis.revenueChange,
            icon: "💰",
          },
          {
            label: "Jobs Completed",
            value: String(kpis.jobsCompleted),
            change: kpis.jobsChange,
            icon: "🔧",
          },
          {
            label: "Avg Job Value",
            value: kpis.jobsCompleted > 0
              ? formatCurrencyFull(kpis.revenueTotal / kpis.jobsCompleted)
              : "$0.00",
            change: null,
            icon: "📊",
          },
          {
            label: "New Clients",
            value: String(kpis.newClients),
            change: null,
            icon: "👤",
          },
        ].map(({ label, value, change, icon }) => (
          <article
            key={label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
              <span className="text-lg" aria-hidden>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            {change !== null ? (
              <div className="mt-1">
                <ChangeTag value={change} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {/* Revenue bar chart */}
      <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">
          Monthly Revenue (AUD) — last {periodMonths} months
        </h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No paid invoice data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: unknown) => formatCurrency(Number(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                }}
                formatter={(v: unknown) => [formatCurrencyFull(Number(v)), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job status breakdown */}
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Job Status Breakdown</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No jobs yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status.toLowerCase().replace(" ", "_")] ?? "#94A3B8"}
                      />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                        {value.replace(/_/g, " ")}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {statusBreakdown.map(({ status, count }) => {
                  const pct = totalStatusCount > 0 ? Math.round((count / totalStatusCount) * 100) : 0;
                  const color = STATUS_COLORS[status.toLowerCase().replace(" ", "_")] ?? "#94A3B8";
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] capitalize">{status.replace(/_/g, " ")}</span>
                        <span className="text-[var(--text-muted)]">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </article>

        {/* Jobs per month line chart */}
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Jobs Completed per Month</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                  formatter={(v: unknown) => [String(v), "Jobs"]}
                />
                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: "#8B5CF6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      {/* Top clients */}
      {topClients.length > 0 ? (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Top Clients by Revenue</h2>
          <div className="space-y-3">
            {topClients.map(({ name, revenue }) => {
              const maxRevenue = topClients[0]?.revenue ?? 1;
              const pct = Math.round((revenue / maxRevenue) * 100);
              return (
                <div key={name} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate text-[var(--text-secondary)]">{name}</span>
                      <span className="font-semibold text-[var(--text-primary)] shrink-0 ml-2">
                        {formatCurrencyFull(revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: "var(--accent-color)" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      ) : null}
    </div>
  );
}
