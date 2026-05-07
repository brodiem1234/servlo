import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLOR = "#6366F1";
const COLOR_LIGHT = "#A5B4FC";
const COLOR_BG = "rgb(99 102 241 / 0.12)";
const COLOR_BORDER = "rgb(99 102 241 / 0.3)";

const ELIGIBILITY = [
  "ABN registered for 12+ months",
  "Annual turnover of $100K or more",
  "No current bankruptcy or liquidation",
  "Australian business bank account",
  "Clean credit history (no defaults in 2 years)",
];

export default async function FinanceHubDashboardPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
            SERVLO Finance Hub is launching Q3 2027. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Business lending designed for Australian tradies and service businesses.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Finance Hub Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      {/* Hero card */}
      <div
        className="rounded-xl border p-8"
        style={{
          background: `linear-gradient(135deg, ${COLOR_BG} 0%, rgba(99,102,241,0.06) 100%)`,
          borderColor: COLOR_BORDER,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Business lending for tradies.
            </h1>
            <p className="mt-1 text-3xl font-black" style={{ color: COLOR_LIGHT }}>
              Up to $500K
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Decision in 24 hours. Competitive rates. No early repayment fees.
            </p>
          </div>
          <button
            disabled
            className="shrink-0 cursor-not-allowed rounded-xl px-8 py-4 text-base font-bold text-white opacity-50"
            style={{ background: COLOR }}
            title="Available at launch Q3 2027"
          >
            Apply now (coming soon)
          </button>
        </div>
      </div>

      {/* Eligibility */}
      <div className="grid gap-6 md:grid-cols-2">
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="mb-4 text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Eligibility requirements
          </h2>
          <ul className="space-y-3">
            {ELIGIBILITY.map((req) => (
              <li key={req} className="flex items-start gap-3">
                <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: COLOR }} />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {req}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="mb-4 text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Loan products
          </h2>
          <div className="space-y-3">
            {[
              { name: "Equipment Finance", range: "$5K – $250K", rate: "From 6.9% p.a." },
              { name: "Business Loan", range: "$10K – $500K", rate: "From 8.5% p.a." },
              { name: "Overdraft Facility", range: "Up to $100K", rate: "From 7.5% p.a." },
              { name: "Invoice Finance", range: "Up to 85% of invoice", rate: "1.5% per 30 days" },
            ].map((product) => (
              <div
                key={product.name}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ background: COLOR_BG }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {product.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {product.range}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: COLOR_LIGHT }}>
                  {product.rate}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/finance-hub/calculator"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: COLOR }}
          >
            Try loan calculator →
          </Link>
        </div>
      </div>
    </section>
  );
}
