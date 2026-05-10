"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

const TIERS = [
  {
    name: "Solo",
    desc: "Perfect for sole traders",
    monthly: 39,
    annual: 32.5,
    annualTotal: 390,
    href: "/auth/signup?plan=solo",
    highlight: false,
    badge: null,
    earlyAdopter: 9.75,
    features: [
      "Unlimited jobs & invoices",
      "Client management (CRM)",
      "Quote builder with PDF",
      "Basic scheduling",
      "AI receipt scanning for materials",
      "Digital signatures on site",
      "Client portal for quotes + payments",
      "Mobile app",
      "Email support"
    ]
  },
  {
    name: "Team",
    desc: "For growing trade businesses",
    monthly: 89,
    annual: 74,
    annualTotal: 888,
    href: "/auth/signup?plan=team",
    highlight: true,
    badge: "Most popular",
    earlyAdopter: 22.25,
    features: [
      "Everything in Solo",
      "Unlimited team members",
      "Timesheets & clock in/out",
      "Purchase orders",
      "Business dashboard & reports",
      "Priority support"
    ]
  },
  {
    name: "Business",
    desc: "For established operations",
    monthly: 179,
    annual: 149,
    annualTotal: 1788,
    href: "/auth/signup?plan=business",
    highlight: false,
    badge: "Early adopter price locked",
    earlyAdopter: 44.75,
    features: [
      "Everything in Team",
      "Advanced analytics",
      "Multi-location support",
      "API access",
      "Dedicated onboarding",
      "Phone support"
    ]
  }
];

const SPOTS_REMAINING = 47;

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Early adopter callout */}
      <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 md:mb-10 md:p-5">
        <div className="flex items-start gap-3">
          <Zap size={18} className="mt-0.5 shrink-0 fill-amber-400 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-300 md:text-base">
              Founding 100 offer &mdash; 75% off your first 3 months
            </p>
            <p className="mt-1 text-xs text-amber-200/80 md:text-sm">
              Use code <span className="font-mono font-bold text-amber-300">EARLYACCESS</span> at checkout.{" "}
              <span className="font-bold text-white">{SPOTS_REMAINING} of 50 spots remaining.</span>
            </p>
            <p className="mt-2 text-xs text-amber-200/70 md:text-sm">
              Solo from <strong className="text-amber-200">$9.75/mo</strong>
              <span className="hidden sm:inline"> &nbsp;&middot;&nbsp; </span>
              <span className="block sm:inline">Team from <strong className="text-amber-200">$22.25/mo</strong></span>
              <span className="hidden sm:inline"> &nbsp;&middot;&nbsp; </span>
              <span className="block sm:inline">Business from <strong className="text-amber-200">$44.75/mo</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="mb-8 flex items-center justify-center gap-3 md:mb-10">
        <span className={`text-sm font-medium ${!annual ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-400"}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${annual ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-400"}`}>
          Annual{" "}
          <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Save 17%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid gap-5 md:gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const price = annual ? tier.annual : tier.monthly;
          const displayPrice = Number.isInteger(price) ? price : price.toFixed(2);
          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-6 md:p-8 ${
                tier.highlight
                  ? "border-blue-500 bg-blue-950/60 shadow-[0_0_40px_-8px_rgba(59,130,246,0.4)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {tier.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${
                    tier.highlight
                      ? "bg-blue-500 text-white"
                      : "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {tier.badge}
                </div>
              )}
              <div className="mb-5 md:mb-6">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{tier.desc}</p>
              </div>
              <div className="mb-5 md:mb-6">
                <span className="text-4xl font-extrabold tabular-nums text-white">${displayPrice}</span>
                <span className="ml-1 text-sm text-slate-400">/mo</span>
                {annual && (
                  <p className="mt-1 text-xs text-slate-500">
                    Billed ${tier.annualTotal}/yr
                  </p>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-3 md:mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check size={15} className="mt-0.5 shrink-0 text-blue-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                  tier.highlight
                    ? "bg-blue-500 text-white hover:bg-blue-400"
                    : "border border-white/20 text-white hover:border-white/40 hover:bg-white/5"
                }`}
              >
                Start free trial
              </Link>
            </div>
          );
        })}
      </div>

      {/* Comparison note */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center md:mt-8">
        <p className="text-xs text-slate-300 md:text-sm">
          If you do 50+ jobs a month, SERVLO Solo ($39) beats ServiceM8 Growing ($79).{" "}
          <strong className="text-white">You save $480/year.</strong>
        </p>
        <Link
          href="/compare/servicem8"
          className="mt-1 inline-block text-xs font-semibold text-blue-400 transition hover:text-blue-300"
        >
          See full pricing comparison →
        </Link>
      </div>

      <p className="mt-5 text-center text-xs text-slate-400 md:mt-6 md:text-sm">
        All plans include a 30-day free trial &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; Cancel anytime
      </p>
    </div>
  );
}
