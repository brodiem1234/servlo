import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, Wrench, Truck, HeartPulse } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR = "#F43F5E";
const COLOR_LIGHT = "#FDA4AF";
const COLOR_BG = "rgb(244 63 94 / 0.12)";
const COLOR_BORDER = "rgb(244 63 94 / 0.3)";

type InsuranceType = {
  label: string;
  sub: string;
  coverage: string;
  Icon: LucideIcon;
};

const INSURANCE_TYPES: InsuranceType[] = [
  {
    label: "Public Liability",
    sub: "Protects you from third-party claims for injury or property damage.",
    coverage: "$5M – $20M coverage",
    Icon: Shield,
  },
  {
    label: "Tools & Equipment",
    sub: "Covers loss, theft and damage to your tools and gear.",
    coverage: "Up to $50K replacement",
    Icon: Wrench,
  },
  {
    label: "Vehicle",
    sub: "Comprehensive cover for your work utes, vans and fleet vehicles.",
    coverage: "Agreed or market value",
    Icon: Truck,
  },
  {
    label: "Income Protection",
    sub: "Monthly income if you can't work due to illness or injury.",
    coverage: "Up to 75% of income",
    Icon: HeartPulse,
  },
];

export default async function InsuranceDashboardPage() {
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
            SERVLO Insurance is launching Q4 2027. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Embedded insurance built for Australian tradies — fast quotes, no brokers.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Insurance Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Insurance Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Purpose-built trade insurance — get a quote in minutes.
        </p>
      </div>

      {/* Insurance type cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {INSURANCE_TYPES.map(({ label, sub, coverage, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-4 rounded-xl border p-6"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: COLOR_BG }}
              >
                <Icon size={20} style={{ color: COLOR }} />
              </span>
              <div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {label}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {sub}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: COLOR_BG }}
            >
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Coverage
              </span>
              <span className="text-xs font-bold" style={{ color: COLOR_LIGHT }}>
                {coverage}
              </span>
            </div>

            <Link
              href="/dashboard/insurance/quote"
              className="flex items-center justify-center rounded-lg py-2.5 text-sm font-semibold no-underline opacity-60"
              style={{ background: COLOR_BG, color: COLOR_LIGHT, border: `1px solid ${COLOR_BORDER}` }}
              title="Coming Q4 2027"
            >
              Get quote (coming Q4 2027)
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
