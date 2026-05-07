import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, DollarSign, Clock, BarChart2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLOR = "#22C55E";
const COLOR_LIGHT = "#86EFAC";
const COLOR_BG = "rgb(34 197 94 / 0.12)";
const COLOR_BORDER = "rgb(34 197 94 / 0.3)";

const STAT_CARDS = [
  {
    label: "Processed This Month",
    value: "—",
    Icon: CreditCard,
    sub: "Available when Pay launches Q4 2026",
  },
  {
    label: "Fees Charged",
    value: "—",
    Icon: DollarSign,
    sub: "Available when Pay launches Q4 2026",
  },
  {
    label: "Pending Payout",
    value: "—",
    Icon: Clock,
    sub: "Available when Pay launches Q4 2026",
  },
  {
    label: "Avg Transaction",
    value: "—",
    Icon: BarChart2,
    sub: "Available when Pay launches Q4 2026",
  },
];

export default async function PayDashboardPage() {
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
            SERVLO Pay is launching Q4 2026. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Lowest rates in Australia — 1.4% + 25¢ per transaction. No monthly fees.
          </p>
        </div>
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
          Pay Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Payment processing built for Australian tradies.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: COLOR_BG }}
              >
                <Icon size={15} style={{ color: COLOR }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Rate comparison promo */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Save on every payment
        </h2>
        <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
          SERVLO Pay offers the most competitive rates for Australian service businesses.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "SERVLO Pay", rate: "1.4% + 25¢", highlight: true },
            { name: "Stripe", rate: "1.7% + 30¢", highlight: false },
            { name: "Square", rate: "1.9% + 10¢", highlight: false },
            { name: "PayPal", rate: "2.6% + 30¢", highlight: false },
          ].map((p) => (
            <div
              key={p.name}
              className="rounded-xl p-4"
              style={{
                background: p.highlight ? COLOR_BG : "var(--bg-secondary)",
                border: p.highlight ? `1px solid ${COLOR_BORDER}` : "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: p.highlight ? COLOR_LIGHT : "var(--text-muted)" }}
              >
                {p.name}
              </p>
              <p
                className="mt-1 text-xl font-bold"
                style={{ color: p.highlight ? COLOR : "var(--text-primary)" }}
              >
                {p.rate}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/pay/rates"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: COLOR }}
        >
          View full rate comparison →
        </Link>
      </div>
    </section>
  );
}
