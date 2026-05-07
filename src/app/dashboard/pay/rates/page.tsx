import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR = "#22C55E";
const COLOR_LIGHT = "#86EFAC";
const COLOR_BG = "rgb(34 197 94 / 0.12)";
const COLOR_BORDER = "rgb(34 197 94 / 0.3)";

const PROVIDERS = [
  {
    name: "SERVLO Pay",
    logo: "SP",
    rate: "1.4%",
    fixed: "25¢",
    monthly: "$0",
    payout: "Next day",
    refunds: "Free",
    highlight: true,
  },
  {
    name: "Stripe",
    logo: "St",
    rate: "1.7%",
    fixed: "30¢",
    monthly: "$0",
    payout: "2 days",
    refunds: "Fee kept",
    highlight: false,
  },
  {
    name: "Square",
    logo: "Sq",
    rate: "1.9%",
    fixed: "10¢",
    monthly: "$0",
    payout: "1–2 days",
    refunds: "Fee kept",
    highlight: false,
  },
  {
    name: "PayPal",
    logo: "PP",
    rate: "2.6%",
    fixed: "30¢",
    monthly: "$0",
    payout: "3–5 days",
    refunds: "Partial fee",
    highlight: false,
  },
];

export default async function PayRatesPage() {
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
        <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
          SERVLO Pay is launching Q4 2026. Lock in founding member rates now.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Pay Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Rate Comparison
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          See how SERVLO Pay stacks up against other payment providers for Australian tradies.
        </p>
      </div>

      {/* Rate cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROVIDERS.map((p) => (
          <div
            key={p.name}
            className="flex flex-col gap-4 rounded-xl border p-5"
            style={{
              background: p.highlight ? COLOR_BG : "var(--bg-card)",
              borderColor: p.highlight ? COLOR_BORDER : "var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ background: p.highlight ? COLOR : "rgba(255,255,255,0.1)" }}
              >
                {p.logo}
              </div>
              <p
                className="font-bold"
                style={{ color: p.highlight ? COLOR_LIGHT : "var(--text-primary)" }}
              >
                {p.name}
              </p>
              {p.highlight && (
                <CheckCircle size={14} style={{ color: COLOR }} className="ml-auto" />
              )}
            </div>

            <div>
              <p
                className="text-3xl font-black tabular-nums"
                style={{ color: p.highlight ? COLOR : "var(--text-primary)" }}
              >
                {p.rate}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                + {p.fixed} per transaction
              </p>
            </div>

            <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              {[
                { label: "Monthly fee", val: p.monthly },
                { label: "Payout time", val: p.payout },
                { label: "Refunds", val: p.refunds },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: p.highlight ? COLOR_LIGHT : "var(--text-primary)" }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Savings calculator note */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          How much could you save?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          On <span className="font-semibold" style={{ color: "var(--text-primary)" }}>$10,000/month</span> in card payments, SERVLO Pay saves you approximately{" "}
          <span className="font-bold" style={{ color: COLOR }}>$45–$120</span> compared to Stripe, Square and PayPal — that&apos;s up to{" "}
          <span className="font-bold" style={{ color: COLOR }}>$1,440 per year</span> staying in your pocket.
        </p>
      </div>
    </section>
  );
}
