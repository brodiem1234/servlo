"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Solo",
    desc: "Perfect for sole traders",
    monthly: 49,
    annual: 39,
    href: "/auth/signup?plan=solo",
    highlight: false,
    badge: null,
    features: [
      "Unlimited jobs & invoices",
      "Client management (CRM)",
      "Quote builder with PDF",
      "Basic scheduling",
      "Mobile app",
      "Email support"
    ]
  },
  {
    name: "Team",
    desc: "For growing trade businesses",
    monthly: 99,
    annual: 79,
    href: "/auth/signup?plan=team",
    highlight: true,
    badge: "Most popular",
    features: [
      "Everything in Solo",
      "Up to 10 team members",
      "Timesheets & clock in/out",
      "Purchase orders",
      "Business dashboard & reports",
      "Priority support"
    ]
  },
  {
    name: "Business",
    desc: "For established operations",
    monthly: 199,
    annual: 159,
    href: "/auth/signup?plan=business",
    highlight: false,
    badge: "Early adopter price locked",
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Advanced analytics",
      "Multi-location support",
      "API access",
      "Dedicated onboarding"
    ]
  }
];

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-white" : "text-slate-400"}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? "bg-blue-500" : "bg-slate-600"}`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-white" : "text-slate-400"}`}>
          Annual{" "}
          <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
            Save 20%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const price = annual ? tier.annual : tier.monthly;
          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? "border-blue-500 bg-blue-950/60 shadow-[0_0_40px_-8px_rgba(59,130,246,0.4)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {tier.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    tier.highlight
                      ? "bg-blue-500 text-white"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {tier.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{tier.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold tabular-nums text-white">${price}</span>
                <span className="ml-1 text-sm text-slate-400">/mo</span>
                {annual && (
                  <p className="mt-1 text-xs text-slate-500">
                    Billed ${price * 12}/yr
                  </p>
                )}
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check size={15} className="mt-0.5 shrink-0 text-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`block rounded-xl py-3 text-center text-sm font-semibold transition ${
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

      <p className="mt-8 text-center text-sm text-slate-400">
        All plans include a 30-day free trial · No credit card required · Cancel anytime
      </p>
    </div>
  );
}
