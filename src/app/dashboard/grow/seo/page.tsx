"use client";

import React from "react";
import { Search, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderColor: "var(--border)",
};

const KEYWORDS = [
  { term: "Plumber Sydney", position: 3, trend: "up" as const, searches: "2,400/mo" },
  { term: "Emergency plumber", position: 7, trend: "flat" as const, searches: "1,200/mo" },
  { term: "Hot water system repairs", position: 12, trend: "up" as const, searches: "880/mo" },
  { term: "Blocked drain Sydney", position: 5, trend: "down" as const, searches: "1,100/mo" },
  { term: "Plumber near me", position: 4, trend: "up" as const, searches: "4,400/mo" },
];

const SEO_CHECKS = [
  { label: "Mobile-friendly", pass: true },
  { label: "HTTPS", pass: true },
  { label: "Local keywords", pass: false },
  { label: "Citations", value: "3/5" },
  { label: "Reviews", value: "4.8 ⭐" },
];

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return <TrendingUp size={14} style={{ color: "#10B981" }} />;
  if (trend === "down")
    return <TrendingDown size={14} style={{ color: "#EF4444" }} />;
  return <Minus size={14} style={{ color: "#94A3B8" }} />;
}

function SeoRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" fill="none" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="rgb(139 92 246 / 0.15)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="#8B5CF6"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {score}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          / 100
        </span>
      </div>
    </div>
  );
}

export default function LocalSeoPage() {
  return (
    <>
      <title>SERVLO GROW — Local SEO</title>
      <section className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Local SEO
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Track your local search presence and Google rankings.
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
            style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
          >
            Coming soon
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Google Business Profile card */}
          <div className="rounded-xl border p-5 space-y-4" style={cardStyle}>
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: "#A78BFA" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Google Business Profile
              </h2>
            </div>

            {/* Mock stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Rating", value: "4.8 ⭐" },
                { label: "Reviews", value: "47" },
                { label: "Profile views", value: "1,240/mo" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg p-3 text-center"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-lg py-2.5 text-sm font-semibold opacity-50"
              style={{ background: "#8B5CF6", color: "#fff" }}
            >
              Connect Google Business Profile
            </button>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Sync your GBP reviews automatically — coming soon
            </p>
          </div>

          {/* SEO Score card */}
          <div className="rounded-xl border p-5 space-y-4" style={cardStyle}>
            <div className="flex items-center gap-2">
              <Search size={16} style={{ color: "#A78BFA" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                SEO Score
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <SeoRing score={72} />
              <div className="flex flex-col gap-2">
                {SEO_CHECKS.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    {check.value != null ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
                      >
                        {check.value}
                      </span>
                    ) : check.pass ? (
                      <span style={{ color: "#10B981" }}>✓</span>
                    ) : (
                      <span style={{ color: "#EF4444" }}>✗</span>
                    )}
                    <span style={{ color: check.pass === false ? "var(--text-muted)" : "var(--text-secondary)" }}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Keyword tracker */}
        <div className="rounded-xl border" style={cardStyle}>
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: "#A78BFA" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Keyword Tracker
              </h2>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgb(139 92 246 / 0.15)", color: "#C4B5FD" }}
            >
              Demo data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs font-semibold uppercase"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Trend</th>
                  <th className="px-4 py-3">Monthly searches</th>
                </tr>
              </thead>
              <tbody>
                {KEYWORDS.map((kw) => (
                  <tr
                    key={kw.term}
                    className="border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {kw.term}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          background:
                            kw.position <= 5
                              ? "rgb(16 185 129 / 0.15)"
                              : kw.position <= 10
                              ? "rgb(245 158 11 / 0.15)"
                              : "rgb(107 114 128 / 0.15)",
                          color:
                            kw.position <= 5
                              ? "#10B981"
                              : kw.position <= 10
                              ? "#F59E0B"
                              : "#9CA3AF",
                        }}
                      >
                        #{kw.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TrendIcon trend={kw.trend} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {kw.searches}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
