"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Briefcase, Users } from "lucide-react";

const MONTHLY_REVENUE = [
  { month: "Dec", revenue: 8200 },
  { month: "Jan", revenue: 11400 },
  { month: "Feb", revenue: 9800 },
  { month: "Mar", revenue: 14200 },
  { month: "Apr", revenue: 12600 },
  { month: "May", revenue: 15800 },
];

const JOB_STATUS_DATA = [
  { status: "Completed", count: 24, color: "#22C55E" },
  { status: "In Progress", count: 6, color: "#F59E0B" },
  { status: "Scheduled", count: 12, color: "#3B82F6" },
  { status: "Cancelled", count: 2, color: "#EF4444" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("6m");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 mt-1">Business performance overview</p>
        </div>
        <div className="flex gap-2">
          {["1m", "3m", "6m", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (6mo)", value: "$72,000", change: "+18%", color: "#22C55E", Icon: DollarSign },
          { label: "Jobs Completed", value: "44", change: "+12%", color: "#3B82F6", Icon: Briefcase },
          { label: "Avg Job Value", value: "$1,636", change: "+5%", color: "#8B5CF6", Icon: TrendingUp },
          { label: "New Clients", value: "11", change: "+3", color: "#F59E0B", Icon: Users },
        ].map(({ label, value, change, color, Icon }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-slate-500">{label}</p>
              <div className="rounded p-1.5" style={{ background: color + "22" }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs mt-1" style={{ color }}>{change} vs prev period</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold text-white mb-4">Monthly Revenue (AUD)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_REVENUE} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: unknown) => `$${(Number(v) / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: "#111927", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb" }}
              formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job status breakdown */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white mb-4">Job Status Breakdown</h2>
          <div className="space-y-3">
            {JOB_STATUS_DATA.map(({ status, count, color }) => {
              const total = JOB_STATUS_DATA.reduce((s, d) => s + d.count, 0);
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{status}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue trend */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={MONTHLY_REVENUE} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: unknown) => `$${(Number(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: "#111927", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb" }}
                formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top jobs */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold text-white mb-4">Top Revenue Sources</h2>
        <div className="space-y-2">
          {[
            { label: "Installation Work", value: "$28,400", pct: 39 },
            { label: "Service & Repair", value: "$19,200", pct: 27 },
            { label: "Maintenance Contracts", value: "$14,800", pct: 21 },
            { label: "Emergency Callouts", value: "$9,600", pct: 13 },
          ].map(({ label, value, pct }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
