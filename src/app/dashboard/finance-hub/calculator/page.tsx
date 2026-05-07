"use client";

import { useState } from "react";

const COLOR = "#6366F1";
const COLOR_LIGHT = "#A5B4FC";
const COLOR_BG = "rgb(99 102 241 / 0.12)";
const COLOR_BORDER = "rgb(99 102 241 / 0.3)";

const RATES: Record<string, number> = {
  "12": 0.085,
  "24": 0.082,
  "36": 0.079,
  "48": 0.076,
  "60": 0.073,
};

function calcMonthly(amount: number, termMonths: number, annualRate: number): number {
  const r = annualRate / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export default function FinanceHubCalculatorPage() {
  const [amount, setAmount] = useState(50000);
  const [term, setTerm] = useState("36");

  const rate = RATES[term] ?? 0.079;
  const termMonths = parseInt(term);
  const monthly = calcMonthly(amount, termMonths, rate);
  const totalRepay = monthly * termMonths;
  const totalInterest = totalRepay - amount;

  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
          SERVLO Finance Hub is launching Q3 2027. Rates shown are indicative only.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Finance Hub Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Loan Calculator
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Estimate your monthly repayments. Rates are indicative — actual rates depend on your profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inputs */}
        <div
          className="space-y-6 rounded-xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {/* Amount slider */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Loan Amount
              </label>
              <span className="text-lg font-bold tabular-nums" style={{ color: COLOR_LIGHT }}>
                ${amount.toLocaleString("en-AU")}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={500000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>$5,000</span>
              <span>$500,000</span>
            </div>
          </div>

          {/* Term selector */}
          <div>
            <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Loan Term
            </label>
            <div className="flex gap-2">
              {Object.keys(RATES).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold transition-colors"
                  style={{
                    background: term === t ? COLOR : "var(--bg-secondary)",
                    color: term === t ? "#fff" : "var(--text-muted)",
                    border: term === t ? "none" : "1px solid var(--border)",
                  }}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>

          {/* Rate display */}
          <div
            className="rounded-lg p-3"
            style={{ background: COLOR_BG }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Indicative interest rate
            </p>
            <p className="text-xl font-bold" style={{ color: COLOR_LIGHT }}>
              {(rate * 100).toFixed(1)}% p.a.
            </p>
          </div>
        </div>

        {/* Results */}
        <div
          className="flex flex-col gap-4 rounded-xl border p-6"
          style={{
            background: `linear-gradient(135deg, ${COLOR_BG} 0%, rgba(99,102,241,0.05) 100%)`,
            borderColor: COLOR_BORDER,
          }}
        >
          <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
            Estimated repayments
          </p>

          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Monthly repayment
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
              ${monthly.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              per month for {term} months
            </p>
          </div>

          <div
            className="space-y-3 border-t pt-4"
            style={{ borderColor: "rgba(99,102,241,0.3)" }}
          >
            {[
              { label: "Loan amount", val: `$${amount.toLocaleString("en-AU")}` },
              {
                label: "Total interest",
                val: `$${totalInterest.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              },
              {
                label: "Total repayable",
                val: `$${totalRepay.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {label}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-auto text-xs" style={{ color: "var(--text-muted)" }}>
            Rates shown are indicative only. Actual rates depend on your business profile, credit history and loan purpose. Available from Q3 2027.
          </p>
        </div>
      </div>
    </section>
  );
}
