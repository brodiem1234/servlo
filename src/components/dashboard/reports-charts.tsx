"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const CHART_COLORS = {
  blue: "#3B82F6",
  purple: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
};

const JOB_STATUS_COLORS: Record<string, string> = {
  pending: CHART_COLORS.amber,
  scheduled: CHART_COLORS.blue,
  in_progress: CHART_COLORS.purple,
  completed: CHART_COLORS.emerald,
  cancelled: CHART_COLORS.red,
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: CHART_COLORS.emerald,
  unpaid: CHART_COLORS.amber,
  overdue: CHART_COLORS.red,
  draft: "#94A3B8",
};

export type MonthRevenue = {
  month: string; // e.g. "Jan", "Feb"
  revenue: number;
};

export type JobStatusCount = {
  status: string;
  count: number;
};

export type InvoiceStatusTotal = {
  status: string;
  total: number;
};

function formatAud(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatAudFull(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function capitalise(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ──────────────────────────────────────────────────────────────────────────────
// Revenue bar chart
// ──────────────────────────────────────────────────────────────────────────────

type RevenueBarChartProps = {
  data: MonthRevenue[];
};

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
        No paid invoices in the last 12 months.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAud}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value) => [formatAudFull(Number(value ?? 0)), "Revenue"]}
          contentStyle={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <Bar dataKey="revenue" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Jobs donut chart
// ──────────────────────────────────────────────────────────────────────────────

type JobsDonutChartProps = {
  data: JobStatusCount[];
};

export function JobsDonutChart({ data }: JobsDonutChartProps) {
  const filtered = data.filter((d) => d.count > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-[var(--text-muted)]">
        No jobs yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          label={({ name, percent }: { name?: string; percent?: number }) =>
            name != null && percent != null
              ? `${capitalise(name)} ${(percent * 100).toFixed(0)}%`
              : ""
          }
          labelLine={false}
        >
          {filtered.map((entry) => (
            <Cell
              key={entry.status}
              fill={JOB_STATUS_COLORS[entry.status] ?? CHART_COLORS.blue}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, capitalise(String(name ?? ""))]}
          contentStyle={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <Legend
          formatter={(value: string) => capitalise(value)}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Invoice status pie chart
// ──────────────────────────────────────────────────────────────────────────────

type InvoiceStatusPieChartProps = {
  data: InvoiceStatusTotal[];
};

export function InvoiceStatusPieChart({ data }: InvoiceStatusPieChartProps) {
  const filtered = data.filter((d) => d.total > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-[var(--text-muted)]">
        No invoice data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="total"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={80}
          paddingAngle={2}
        >
          {filtered.map((entry) => (
            <Cell
              key={entry.status}
              fill={INVOICE_STATUS_COLORS[entry.status] ?? CHART_COLORS.blue}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatAudFull(Number(value ?? 0)), capitalise(String(name ?? ""))]}
          contentStyle={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <Legend
          formatter={(value: string) => capitalise(value)}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
