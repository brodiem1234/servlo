"use client";

import { useState } from "react";

type BasResult = {
  g1_total_sales: number;
  gst_collected: number;
  total_purchases: number;
  gst_paid: number;
  net_gst: number;
  quarter: string;
  summary: string;
  tips: string[];
};

function quarterStart(offset: number = 0): string {
  const now = new Date();
  const qMonth = Math.floor((now.getMonth() - offset * 3 + 12) % 12 / 3) * 3;
  const year = now.getFullYear() - (now.getMonth() - offset * 3 < 0 ? 1 : 0);
  return new Date(year, qMonth, 1).toISOString().slice(0, 10);
}

function quarterEnd(offset: number = 0): string {
  const now = new Date();
  const qMonth = Math.floor((now.getMonth() - offset * 3 + 12) % 12 / 3) * 3;
  const year = now.getFullYear() - (now.getMonth() - offset * 3 < 0 ? 1 : 0);
  return new Date(year, qMonth + 3, 0).toISOString().slice(0, 10);
}

export default function BasPage() {
  const [qStart, setQStart] = useState(quarterStart(0));
  const [qEnd, setQEnd] = useState(quarterEnd(0));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BasResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/bas-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter_start: qStart, quarter_end: qEnd }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(d.message ?? d.error ?? "Calculation failed");
      }
      const d = await res.json();
      setResult(d as BasResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const selectQuarter = (offset: number) => {
    setQStart(quarterStart(offset));
    setQEnd(quarterEnd(offset));
    setResult(null);
  };

  const inputCls = "h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">BAS Helper</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Estimate your Business Activity Statement figures from your SERVLO data.
          Always verify with a registered BAS agent before lodging.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        This is an estimate only, not tax advice. Consult a registered BAS agent or accountant before lodging.
      </div>

      {/* Quarter selector */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Select quarter</h2>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((offset) => (
            <button
              key={offset}
              type="button"
              onClick={() => selectQuarter(offset)}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${qStart === quarterStart(offset) ? "bg-[var(--accent-color)] text-white border-transparent" : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"}`}
            >
              {offset === 0 ? "Current quarter" : `${offset} quarter${offset > 1 ? "s" : ""} ago`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">From</label>
            <input type="date" className={inputCls} value={qStart} onChange={(e) => setQStart(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">To</label>
            <input type="date" className={inputCls} value={qEnd} onChange={(e) => setQEnd(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          onClick={calculate}
          disabled={loading}
          className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? "Calculating…" : <><span aria-hidden>✨</span> Calculate BAS</>}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          {/* Figures */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">BAS figures — {result.quarter}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "G1 Total sales (inc. GST)", value: result.g1_total_sales },
                { label: "GST collected (1A)", value: result.gst_collected, highlight: true },
                { label: "Total purchases (inc. GST)", value: result.total_purchases },
                { label: "Input tax credits (1B)", value: result.gst_paid },
                { label: "Net GST payable / (refund)", value: result.net_gst, highlight: true, color: result.net_gst > 0 ? "red" : "green" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg border p-3 ${stat.highlight ? "border-[var(--accent-color)]/30 bg-[var(--accent-color)]/5" : "border-[var(--border)]"}`}>
                  <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                  <p className={`mt-1 text-xl font-bold ${stat.color === "red" ? "text-red-600 dark:text-red-400" : stat.color === "green" ? "text-green-600 dark:text-green-400" : "text-[var(--text-primary)]"}`}>
                    ${Math.abs(stat.value).toFixed(2)}
                    {stat.label.includes("Net") && stat.value < 0 ? " refund" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <span aria-hidden>✨</span> AI Summary
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{result.summary}</p>
            {result.tips.length > 0 ? (
              <ul className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-0.5 text-[var(--accent-color)]">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
