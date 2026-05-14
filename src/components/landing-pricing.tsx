"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Star, Lock, TrendingUp, Zap, Check, X } from "lucide-react";
import { PLANS as PRICING_PLANS_CONST, EARLY_ADOPTER_DISCOUNT } from "@/lib/pricing";

type PricingPlanData = {
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualMonthlyEquiv: number | null;
};
const PRICING_PLANS = PRICING_PLANS_CONST as Record<string, PricingPlanData>;

/* ─── Price data ─────────────────────────────────────────────────────────── */

type PlanId = "free" | "solo" | "team" | "business" | "enterprise";

const PLANS: Array<{
  id: PlanId;
  name: string;
  badge: string | null;
  badgeColor: string;
  desc: string;
}> = [
  { id: "free",       name: "Free",       badge: "Just browsing",  badgeColor: "bg-slate-500 text-white",       desc: "Try at no cost"            },
  { id: "solo",       name: "Solo",       badge: null,             badgeColor: "",                              desc: "For sole operators"        },
  { id: "team",       name: "Team",       badge: "Most Popular",   badgeColor: "bg-blue-500 text-white",        desc: "The obvious choice"        },
  { id: "business",   name: "Business",   badge: "Best Value",     badgeColor: "bg-emerald-600 text-white",     desc: "For scaling businesses"    },
  { id: "enterprise", name: "Enterprise", badge: null,             badgeColor: "",                              desc: "For large teams"           },
];

/* ─── Feature matrix ─────────────────────────────────────────────────────── */

type FVal = boolean | string;
type FeatureRow = { label: string; values: [FVal, FVal, FVal, FVal, FVal] };
type FeatureSection = { section: string; rows: FeatureRow[] };

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    section: "Platform",
    rows: [
      { label: "Users",               values: ["1", "1", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Jobs per month",       values: ["5", "Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Jobs & scheduling",    values: [true, true, true, true, true] },
      { label: "Clients & CRM",        values: [true, true, true, true, true] },
      { label: "Invoices & quotes",    values: [true, true, true, true, true] },
      { label: "Invoice watermark",    values: [true, false, false, false, false] },
      { label: "PDF generation",       values: [true, true, true, true, true] },
      { label: "Mobile app",           values: [true, true, true, true, true] },
    ],
  },
  {
    section: "AI",
    rows: [
      { label: "AI generations/month", values: ["0", "50", "200", "500", "2,000"] },
    ],
  },
  {
    section: "Team",
    rows: [
      { label: "Employee management",  values: [false, false, true, true, true] },
      { label: "GPS clock in / out",   values: [false, false, true, true, true] },
      { label: "Job photos & proof",   values: [false, false, true, true, true] },
      { label: "Timesheets",           values: [false, false, true, true, true] },
      { label: "Team invitations",     values: [false, false, true, true, true] },
    ],
  },
  {
    section: "Advanced",
    rows: [
      { label: "Xero & MYOB integration", values: [false, false, false, true, true] },
      { label: "BAS prep helper",          values: [false, false, false, true, true] },
      { label: "Advanced reporting",       values: [false, false, false, true, true] },
      { label: "Custom forms",             values: [false, false, false, true, true] },
    ],
  },
  {
    section: "Enterprise",
    rows: [
      { label: "Custom integrations",       values: [false, false, false, false, true] },
      { label: "Dedicated account manager", values: [false, false, false, false, true] },
      { label: "SLA guarantee",             values: [false, false, false, false, true] },
      { label: "White-glove onboarding",    values: [false, false, false, false, true] },
    ],
  },
  {
    section: "Support",
    rows: [
      { label: "Support tier",      values: ["Community", "Email", "Priority", "Dedicated", "24/7"] },
      { label: "30-day free trial", values: [false, true, true, true, true] },
    ],
  },
];

/* ─── Bundle cards ───────────────────────────────────────────────────────── */

type BundleCard = {
  name: string;
  tag: string;
  price: number | null;
  desc: string;
  badge: string | null;
  comingSoon: boolean;
  highlight: boolean;
  isEnterprise: boolean;
};

const BUNDLES: BundleCard[] = [
  { name: "Core Solo",       tag: "Core · Solo",          price: 39,   desc: "1 user. Jobs, clients, invoices.",                       badge: null,           comingSoon: false, highlight: false, isEnterprise: false },
  { name: "Core Team",       tag: "Core · Team",          price: 89,   desc: "Unlimited users. Includes all team features.",           badge: "Most Popular", comingSoon: false, highlight: true,  isEnterprise: false },
  { name: "Core Business",   tag: "Core · Business",      price: 179,  desc: "Unlimited users. Advanced reporting + integrations.",    badge: null,           comingSoon: false, highlight: false, isEnterprise: false },
  { name: "Core Enterprise", tag: "Core · Enterprise",    price: null, desc: "Unlimited users. Dedicated support + SLA guarantee.",    badge: null,           comingSoon: false, highlight: false, isEnterprise: true  },
  { name: "Core + Grow",     tag: "Combo · Coming soon",  price: 149,  desc: "Team plan + Grow Starter. Manage and market together.",  badge: null,           comingSoon: true,  highlight: false, isEnterprise: false },
  { name: "Core + Leads",    tag: "Combo · Coming soon",  price: 149,  desc: "Team plan + 10 leads/mo. Run ops and fill your pipeline.",badge: null,          comingSoon: true,  highlight: false, isEnterprise: false },
];

/* ─── FAQ ────────────────────────────────────────────────────────────────── */

const FAQ_ITEMS = [
  {
    q: "Is there really no credit card required for the free trial?",
    a: "Correct. You start your 30-day trial the moment you sign up. We only ask for payment details when you're ready to continue after the trial ends.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade or downgrade at any time from your account settings. Upgrades take effect immediately; downgrades apply at the next billing cycle.",
  },
  {
    q: "What happens after the 30-day trial?",
    a: "You'll receive a reminder before your trial ends. If you don't add payment details your account is paused: your data stays safe and you can resume whenever you're ready.",
  },
  {
    q: "Is annual billing cheaper?",
    a: "Annual billing saves you ~17% compared to monthly. The exact saving is shown as a green badge on each plan card when you switch to Annual above.",
  },
  {
    q: "Is SERVLO built specifically for Australian businesses?",
    a: "Yes. We're based in Adelaide, SA. GST, ABN, Australian date formats and local phone formatting are built in from day one, not bolted on.",
  },
  {
    q: "Can I add Grow or Leads to my Core plan later?",
    a: "Grow and Leads are launching in Q3 to Q4 2026. Join the waitlist below and we'll email you when combo bundles become available. Existing subscribers get priority access.",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function FeatureCell({ value, freeFalse }: { value: FVal; freeFalse: boolean }) {
  if (value === true)  return <div className="flex justify-center"><Check size={15} className="text-emerald-500" /></div>;
  if (value === false) return <div className="flex justify-center"><X    size={15} className={freeFalse ? "text-amber-400/70" : "text-slate-400"} /></div>;
  return <div className="text-center text-xs font-medium text-slate-600 dark:text-slate-300">{value}</div>;
}

/* ─── Main component ─────────────────────────────────────────────────────── */

interface LandingPricingProps {
  onEnterpriseContact?: () => void;
}

export function LandingPricing({ onEnterpriseContact }: LandingPricingProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function priceFor(id: PlanId): number | null {
    const plan = PRICING_PLANS[id];
    if (plan.monthlyPrice === null) return null;
    if (plan.monthlyPrice === 0) return 0;
    if (billing === "annual") return Math.round((plan.annualMonthlyEquiv ?? plan.monthlyPrice) * 100) / 100;
    return plan.monthlyPrice;
  }

  function annualSavingsFor(id: PlanId): number {
    const plan = PRICING_PLANS[id];
    if (plan.monthlyPrice === null || plan.monthlyPrice === 0) return 0;
    return (plan.monthlyPrice - (plan.annualMonthlyEquiv ?? plan.monthlyPrice)) * 12;
  }

  // Mobile: show Team first so the "obvious choice" is front-and-centre
  const MOBILE_ORDER: PlanId[] = ["team", "solo", "free", "business", "enterprise"];

  return (
    <div>
      {/* ── Header + billing toggle ─────────────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">Simple pricing, no surprises</h2>
        <p className="text-[#475569] dark:text-slate-300">
          Start free. Add a plan when you&apos;re ready to grow.
        </p>
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-[#111827]">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-white text-[#1e3a5f] shadow-sm dark:bg-[#1e3a5f] dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-white text-[#1e3a5f] shadow-sm dark:bg-[#1e3a5f] dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* ── Early Adopter Banner ────────────────────────────────────────── */}
      <div className="mb-8 rounded-xl border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-900/10">
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Early adopter offer. Use code{" "}
              <span className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-sm dark:bg-amber-800/50">
                {EARLY_ADOPTER_DISCOUNT.code}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
              Get {EARLY_ADOPTER_DISCOUNT.discountPercent}% off for the first {EARLY_ADOPTER_DISCOUNT.months} months.{" "}
              Solo from ${EARLY_ADOPTER_DISCOUNT.plans.solo.discountedMonthly}/mo,{" "}
              Team from ${EARLY_ADOPTER_DISCOUNT.plans.team.discountedMonthly}/mo,{" "}
              Business from ${EARLY_ADOPTER_DISCOUNT.plans.business.discountedMonthly}/mo
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Claim offer →
          </Link>
        </div>
      </div>

      {/* ── Mobile horizontal-scroll cards (Team first) ─────────────────── */}
      <div className="md:hidden -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
        {MOBILE_ORDER.map((id) => {
          const plan = PLANS.find((p) => p.id === id)!;
          const p = priceFor(id);
          const s = annualSavingsFor(id);
          const isTeam = id === "team";
          const isFree = id === "free";
          return (
            <div
              key={id}
              className={`flex w-72 shrink-0 snap-start flex-col rounded-xl border p-5 ${
                isTeam
                  ? "border-blue-500 bg-blue-50 dark:border-blue-500/60 dark:bg-[#10283a]"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-[#1e3a5f] dark:text-white">{plan.name}</h3>
                {plan.badge && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                )}
              </div>
              <p className="mb-3 text-sm text-[#475569] dark:text-slate-400">{plan.desc}</p>
              {p === null ? (
                <p className="text-3xl font-extrabold text-[#1e3a5f] dark:text-white">Custom</p>
              ) : p === 0 ? (
                <p className="text-3xl font-extrabold text-[#1e3a5f] dark:text-white">Free</p>
              ) : (
                <>
                  <p className="text-3xl font-extrabold text-[#1e3a5f] dark:text-white">
                    ${p}<span className="text-base font-normal text-slate-500">/mo</span>
                  </p>
                  {billing === "annual" && s > 0 && (
                    <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      Save ${Math.round(s)}/year
                    </span>
                  )}
                </>
              )}
              {id === "enterprise" ? (
                <button
                  onClick={onEnterpriseContact}
                  className="mt-4 block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                >
                  Contact us
                </button>
              ) : (
                <Link
                  href="/auth/signup"
                  className={`mt-4 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                    isTeam
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : isFree
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                      : "bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a]"
                  }`}
                >
                  {isFree ? "Start free" : "Start Free Trial"}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop feature comparison (div-based grid, not <table>) ──────── */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 md:block">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] bg-slate-50 dark:bg-[#111827]">
          <div className="p-4" />
          {PLANS.map((plan) => {
            const p = priceFor(plan.id);
            const s = annualSavingsFor(plan.id);
            const isTeam = plan.id === "team";
            return (
              <div key={plan.id} className={`p-4 text-center ${isTeam ? "bg-blue-50 dark:bg-[#10283a]" : ""}`}>
                {plan.badge ? (
                  <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                ) : (
                  <div className="mb-1 h-5" />
                )}
                <h3 className="font-bold text-[#1e3a5f] dark:text-white">{plan.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{plan.desc}</p>
                {p === null ? (
                  <p className="mt-2 text-2xl font-extrabold text-[#1e3a5f] dark:text-white">Custom</p>
                ) : p === 0 ? (
                  <p className="mt-2 text-2xl font-extrabold text-[#1e3a5f] dark:text-white">Free</p>
                ) : (
                  <p className="mt-2 text-2xl font-extrabold text-[#1e3a5f] dark:text-white">
                    ${p}<span className="text-xs font-normal text-slate-500">/mo</span>
                  </p>
                )}
                {billing === "annual" && s > 0 ? (
                  <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    Save ${Math.round(s)}/yr
                  </span>
                ) : (
                  <div className="mt-1 h-5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Feature sections */}
        {FEATURE_SECTIONS.map((sec) => (
          <div key={sec.section}>
            <div className="border-t border-slate-200 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {sec.section}
              </div>
            </div>
            {sec.rows.map((row) => {
              const freeFalse = row.values[0] === false;
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] border-t border-slate-100 dark:border-slate-800 ${
                    freeFalse ? "bg-amber-50/40 dark:bg-amber-900/10" : ""
                  }`}
                >
                  <div className="p-3 text-sm text-[#334155] dark:text-slate-300">{row.label}</div>
                  {row.values.map((val, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-center p-3 ${
                        PLANS[i].id === "team" ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      <FeatureCell value={val} freeFalse={freeFalse} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}

        {/* CTA row */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#111827]">
          <div />
          {PLANS.map((plan) => {
            const isTeam = plan.id === "team";
            const isFree = plan.id === "free";
            return (
              <div key={plan.id} className="px-2">
                {plan.id === "enterprise" ? (
                  <button
                    onClick={onEnterpriseContact}
                    className="block w-full rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-[#1e3a5f] hover:bg-slate-100 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                  >
                    Contact us
                  </button>
                ) : (
                  <Link
                    href="/auth/signup"
                    className={`block rounded-lg py-2 text-center text-sm font-semibold ${
                      isTeam
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : isFree
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                        : "bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a]"
                    }`}
                  >
                    {isFree ? "Start free" : "Start Free Trial"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-[#64748b] dark:text-slate-400">
        All paid plans include a 30-day free trial. No credit card required.
      </p>

      {/* ── Why upgrade from Solo? ───────────────────────────────────────── */}
      <div className="mt-14 rounded-2xl bg-[#0f172a] p-8 text-white">
        <h3 className="mb-2 text-center text-2xl font-bold">Why upgrade from Solo?</h3>
        <p className="mb-8 text-center text-slate-400">Solo gets you started. Team lets you scale.</p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: "👥",
              title: "Bring your team",
              points: ["Unlimited team members", "GPS clock in / out", "Timesheets & rosters"],
            },
            {
              icon: "📸",
              title: "Never miss a job",
              points: ["Job photos & proof", "Before / after evidence", "Client sign-off on site"],
            },
            {
              icon: "💸",
              title: "Get paid faster",
              points: ["Priority support", "Multi-user invoicing", "Bulk statements"],
            },
          ].map((col) => (
            <div key={col.title} className="text-center">
              <div className="mb-2 text-3xl">{col.icon}</div>
              <h4 className="mb-2 font-bold text-white">{col.title}</h4>
              <ul className="space-y-1.5 text-sm text-slate-400">
                {col.points.map((pt) => (
                  <li key={pt} className="flex items-center justify-center gap-2">
                    <span className="text-blue-400">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-600"
          >
            Upgrade to Team: $79/mo
          </Link>
        </div>
      </div>

      {/* ── Bundle comparison ────────────────────────────────────────────── */}
      <div className="mt-14">
        <div className="mb-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-color)] dark:text-cyan-400">
            Bundle plans
          </span>
          <h3 className="mt-1 text-2xl font-bold text-[#1e3a5f] dark:text-white">
            Build your perfect stack
          </h3>
          <p className="mt-2 text-[#475569] dark:text-slate-300">
            Combine Core with Grow and Leads for the complete SERVLO platform.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {BUNDLES.map((b) => (
            <div
              key={b.name}
              className={`relative flex flex-col rounded-xl border p-5 ${
                b.highlight
                  ? "border-blue-500 bg-blue-50 dark:border-blue-500/60 dark:bg-[#10283a]"
                  : b.comingSoon
                  ? "border-slate-200 bg-white opacity-80 dark:border-slate-700 dark:bg-[#111827]"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"
              }`}
            >
              {b.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {b.badge}
                </span>
              )}
              {b.comingSoon && (
                <div className="mb-2 flex items-center gap-1.5">
                  <Lock size={10} className="text-slate-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Coming soon
                  </span>
                </div>
              )}
              <p className="mb-1 text-xs font-semibold text-slate-400">{b.tag}</p>
              <h4 className="font-bold text-[#1e3a5f] dark:text-white">{b.name}</h4>
              <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{b.desc}</p>
              {b.price === null ? (
                <p className="mt-3 text-xl font-extrabold text-[#1e3a5f] dark:text-white">Custom</p>
              ) : (
                <p className="mt-3 text-xl font-extrabold text-[#1e3a5f] dark:text-white">
                  From ${b.price}
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
              )}
              {b.comingSoon ? (
                <button
                  disabled
                  className="mt-3 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500"
                >
                  Coming soon
                </button>
              ) : b.isEnterprise ? (
                <button
                  onClick={onEnterpriseContact}
                  className="mt-3 block w-full rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                >
                  Contact us
                </button>
              ) : (
                <Link
                  href="/auth/signup"
                  className={`mt-3 block rounded-lg py-2 text-center text-sm font-semibold ${
                    b.highlight
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a]"
                  }`}
                >
                  Start Free Trial
                </Link>
              )}
            </div>
          ))}

          {/* Full Platform — spans all 3 columns */}
          <div className="relative flex flex-col gap-6 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 p-6 dark:border-amber-500/60 dark:from-amber-900/20 dark:to-orange-900/10 md:col-span-3 md:flex-row">
            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
              <Star size={11} />
              Best Value
            </span>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Full Platform Bundle
              </p>
              <h4 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
                Core + Grow + Leads
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Most businesses choose this
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-[#334155] dark:text-slate-300 sm:grid-cols-3">
                {[
                  "Core Business plan",
                  "Grow Pro (AI marketing)",
                  "Lead Bundle (10 leads/mo)",
                  "Single unified dashboard",
                  "Bundle pricing saves 25%+",
                  "Priority onboarding",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start justify-center gap-3 md:items-end">
              <div className="md:text-right">
                <p className="text-xs text-slate-500 line-through dark:text-slate-400">$428/mo separately</p>
                <p className="text-3xl font-extrabold text-[#1e3a5f] dark:text-white">
                  $299<span className="text-base font-normal text-slate-500">/mo</span>
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Lock size={10} className="text-slate-400" />
                  <span className="text-xs text-slate-400">Launching Q3 2026</span>
                </div>
              </div>
              <button
                disabled
                className="cursor-not-allowed rounded-xl border border-amber-300 bg-amber-100 px-6 py-3 text-sm font-semibold text-amber-700 dark:border-amber-600/40 dark:bg-amber-500/10 dark:text-amber-400"
              >
                Coming soon. Join waitlist below
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grow & Leads pricing ────────────────────────────────────────────── */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Grow pricing */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <TrendingUp size={20} className="text-purple-500" />
            <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">SERVLO Grow</h3>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">Coming Q3 2026</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Starter", price: "$59", desc: "1 business. AI ad creation, 5 campaigns/mo", highlight: false },
              { name: "Pro",     price: "$119", desc: "Up to 3 businesses, unlimited campaigns, review automation", highlight: true  },
              { name: "Agency",  price: "$299", desc: "Manage all your clients. White-label reporting.", highlight: false },
            ].map(({ name, price, desc, highlight }) => (
              <div key={name} className={`rounded-xl border p-4 ${highlight ? "border-purple-400/60 bg-purple-50 dark:bg-purple-900/20" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold text-[#1e3a5f] dark:text-white">{name}</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                </div>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leads pricing */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Zap size={20} className="text-amber-500" />
            <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white">SERVLO Leads</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Coming Q4 2026</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Pay-as-you-go", price: "$12",  unit: "/lead", desc: "No subscription. Pay only for leads you accept.", highlight: false },
              { name: "Verified",      price: "$39",  unit: "/mo",   desc: "5 guaranteed leads per month. Priority matching.", highlight: true  },
              { name: "Pro",           price: "$89",  unit: "/mo",   desc: "15 leads/mo. Advanced filters + direct contact.", highlight: false },
            ].map(({ name, price, unit, desc, highlight }) => (
              <div key={name} className={`rounded-xl border p-4 ${highlight ? "border-amber-400/60 bg-amber-50 dark:bg-amber-900/20" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold text-[#1e3a5f] dark:text-white">{name}</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{price}<span className="text-sm font-normal text-slate-500">{unit}</span></p>
                </div>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grow & Leads coming-soon preview ─────────────────────────────── */}
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Grow */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-500/30 dark:bg-[#1a1030]">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
              <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
            </span>
            <div>
              <h4 className="font-bold text-[#1e3a5f] dark:text-white">SERVLO Grow</h4>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Launching Q3 2026</span>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            AI-powered marketing for service businesses: ads, social content, review automation and referral tracking.
          </p>
          <a
            href="mailto:hello@servlo.com.au?subject=Waitlist%3A%20SERVLO%20Grow"
            className="block rounded-lg border border-purple-300 bg-purple-100 px-4 py-2.5 text-center text-sm font-semibold text-purple-700 hover:bg-purple-200 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20"
          >
            Join the Grow waitlist →
          </a>
        </div>

        {/* Leads */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-[#1c1508]">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
              <Zap size={18} className="text-amber-600 dark:text-amber-400" />
            </span>
            <div>
              <h4 className="font-bold text-[#1e3a5f] dark:text-white">SERVLO Leads</h4>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Launching Q4 2026</span>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Qualified leads matched to your industry and location. Pay per lead or subscribe for a monthly bundle.
          </p>
          <a
            href="mailto:hello@servlo.com.au?subject=Waitlist%3A%20SERVLO%20Leads"
            className="block rounded-lg border border-amber-300 bg-amber-100 px-4 py-2.5 text-center text-sm font-semibold text-amber-700 hover:bg-amber-200 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
          >
            Join the Leads waitlist →
          </a>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div className="mt-14">
        <h3 className="mb-6 text-center text-2xl font-bold text-[#1e3a5f] dark:text-white">
          Frequently asked questions
        </h3>
        <div className="mx-auto max-w-3xl divide-y divide-slate-200 dark:divide-slate-700">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="font-medium text-[#1e3a5f] dark:text-white">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp size={18} className="shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown size={18} className="shrink-0 text-slate-400" />
                )}
              </button>
              {openFaq === i && (
                <p className="mt-3 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
