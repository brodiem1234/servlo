"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, X, ArrowRight, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

// ServiceM8 plan tiers (per-job pricing)
function getServiceM8Plan(jobs: number): { name: string; price: number } {
  if (jobs <= 5)   return { name: "Free",         price: 0   };
  if (jobs <= 15)  return { name: "Lite",          price: 9   };
  if (jobs <= 50)  return { name: "Starter",       price: 29  };
  if (jobs <= 150) return { name: "Growing",       price: 79  };
  if (jobs <= 500) return { name: "Premium",       price: 149 };
  return             { name: "Premium Plus",    price: 349 };
}

// SERVLO pricing — free tier + paid from $29
function getServloPrice(jobs: number): { name: string; price: number } {
  if (jobs <= 5) return { name: "Free", price: 0 };
  return { name: "Solo", price: 29 };
}

const FEATURES: Array<{
  label: string;
  servlo: string | true | false;
  sm8: string | true | false;
  servloWins?: boolean;
}> = [
  { label: "Job management",               servlo: true,           sm8: true },
  { label: "Quoting & invoicing",          servlo: true,           sm8: true },
  { label: "Client management",            servlo: true,           sm8: true },
  { label: "Free plan available",          servlo: true,           sm8: true,  servloWins: false },
  { label: "Unlimited jobs on paid plan",  servlo: true,           sm8: false, servloWins: true },
  { label: "Australian GST/BAS support",   servlo: true,           sm8: true },
  { label: "AI ad generation",             servlo: true,           sm8: false, servloWins: true },
  { label: "AI receipt scanning",          servlo: true,           sm8: false, servloWins: true },
  { label: "AI review responses",          servlo: true,           sm8: false, servloWins: true },
  { label: "AI quote generation",          servlo: true,           sm8: true  },
  { label: "Lead marketplace",             servlo: "Coming Q4 2026", sm8: false, servloWins: true },
  { label: "Xero integration",             servlo: "Coming Q3 2026", sm8: true },
  { label: "Native iOS app",               servlo: "Coming Q3 2026", sm8: true },
  { label: "Offline mode",                 servlo: "Coming Q3 2026", sm8: true },
  { label: "1-click cancel",               servlo: true,           sm8: false, servloWins: true },
  { label: "Full data export",             servlo: true,           sm8: "Partial" },
  { label: "Australian-built",             servlo: true,           sm8: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true)     return <Check size={18} className="mx-auto text-emerald-500 dark:text-emerald-400" />;
  if (value === false)    return <X size={18} className="mx-auto text-gray-400 dark:text-red-400" />;
  if (value === "Partial") return <Minus size={18} className="mx-auto text-amber-500 dark:text-amber-400" />;
  return <span className="text-xs text-amber-600 dark:text-amber-300">{value}</span>;
}

export default function CompareSM8Page() {
  const [jobs, setJobs] = useState(60);
  const sm8 = getServiceM8Plan(jobs);
  const servlo = getServloPrice(jobs);
  const monthlySaving = Math.max(0, sm8.price - servlo.price);
  const annualSaving  = monthlySaving * 12;
  const servloWins    = servlo.price < sm8.price || (servlo.price === 0 && sm8.price === 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">

        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Comparison</p>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white md:text-5xl">
            SERVLO vs ServiceM8
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 dark:text-slate-400">
            An honest, side-by-side comparison. SERVLO is free up to 5 jobs, then $29/mo flat.
            ServiceM8 charges per job tier and lacks AI tools.
          </p>
        </div>

        {/* Savings calculator */}
        <section className="mb-16 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-8">
          <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">How much could you save?</h2>
          <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">Drag the slider to your monthly job volume.</p>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-slate-400">Jobs per month</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{jobs}</span>
          </div>
          <input
            type="range"
            min={1}
            max={500}
            value={jobs}
            onChange={(e) => setJobs(Number(e.target.value))}
            className="mb-8 w-full accent-zinc-900 dark:accent-white"
          />

          <div className="grid gap-5 md:grid-cols-3">
            {/* ServiceM8 */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">ServiceM8</p>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{sm8.name} plan</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-gray-900 dark:text-white">${sm8.price}</p>
              <p className="text-xs text-gray-400 dark:text-slate-400">/mo</p>
            </div>

            {/* SERVLO */}
            <div className={`rounded-xl border p-5 ${servloWins ? "border-emerald-400/40 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/5" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04]"}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                SERVLO {servlo.name}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
                {servlo.price === 0 ? "Free forever" : "Unlimited jobs"}
              </p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-gray-900 dark:text-white">${servlo.price}</p>
              <p className="text-xs text-gray-400 dark:text-slate-400">/mo</p>
            </div>

            {/* Saving */}
            <div className={`rounded-xl border p-5 ${servloWins && monthlySaving > 0 ? "border-emerald-400/40 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04]"}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                {servloWins && monthlySaving > 0 ? "Your saving with SERVLO" : servlo.price === sm8.price ? "Same price" : "ServiceM8 is cheaper"}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-300">per month</p>
              <p className={`mt-2 text-3xl font-extrabold tabular-nums ${servloWins && monthlySaving > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-300"}`}>
                {monthlySaving > 0 ? `$${monthlySaving}` : "$0"}
              </p>
              {servloWins && annualSaving > 0 && (
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                  ${annualSaving.toLocaleString()} saved per year
                </p>
              )}
            </div>
          </div>

          {jobs <= 5 ? (
            <div className="mt-6 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
              At {jobs} jobs/mo, both SERVLO and ServiceM8 have a free tier. SERVLO stays free. ServiceM8 charges once you exceed 5 jobs.
            </div>
          ) : jobs <= 50 ? (
            <div className="mt-6 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
              At {jobs} jobs/mo, ServiceM8 {sm8.name} (${sm8.price}/mo) is cheaper than SERVLO Solo ($29/mo).
              SERVLO becomes better value at 51+ jobs. Plus you get AI tools ServiceM8 doesn&apos;t have.
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
              At {jobs} jobs/mo you need ServiceM8 {sm8.name} (${sm8.price}/mo). SERVLO Solo costs $29/mo. You save{" "}
              <strong>${monthlySaving}/mo (${annualSaving.toLocaleString()}/yr)</strong> and get AI tools on top.
            </div>
          )}
        </section>

        {/* Feature table */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                  <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Feature</th>
                  <th className="px-5 py-4 text-center font-semibold text-gray-900 dark:text-white">SERVLO</th>
                  <th className="px-5 py-4 text-center font-semibold text-gray-500 dark:text-slate-400">ServiceM8</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {FEATURES.map(({ label, servlo: sv, sm8: sm8val, servloWins: sw }) => (
                  <tr key={label} className={`transition hover:bg-gray-50 dark:hover:bg-white/[0.02] ${sw ? "bg-emerald-50/50 dark:bg-emerald-500/[0.03]" : ""}`}>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">{label}</td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={sv} /></td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={sm8val} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Where ServiceM8 wins — honest section */}
        <section className="mb-16 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Where ServiceM8 still wins</h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
            We&apos;re honest about this. ServiceM8 has been around longer and has advantages we don&apos;t yet match.
          </p>
          <ul className="space-y-3">
            {[
              "More reviews and a proven track record across thousands of Australian tradies",
              "Larger compliance forms library (250+ forms vs our 20)",
              "Native iOS app with full offline mode, critical for rural areas",
              "Larger ecosystem of third-party integrations",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 dark:bg-slate-500" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-gray-500 dark:text-slate-400">
            If offline mode or a large forms library is critical to your workflow today, ServiceM8 may be the right call.
            If you&apos;re prioritising AI features, price, and a platform being built for the next 10 years, try SERVLO.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Try SERVLO free. Cancel anytime in one click</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 dark:text-slate-400">
            Free plan up to 5 jobs. Paid from $29/mo with a 30-day free trial. If you don&apos;t love it, cancel from Settings.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-black transition hover:bg-neutral-100"
          >
            Sign Up
            <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
            Or <Link href="/compare/tradify" className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">compare SERVLO with Tradify</Link>
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-white/[0.06] py-8 mt-16 text-center text-xs text-gray-400 dark:text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Link href="/">
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={80} height={22} unoptimized
              className="opacity-60 h-5 w-auto hidden dark:block" />
            <Image src="/servlo-master-dark.svg" alt="SERVLO" width={80} height={22} unoptimized
              className="opacity-60 h-5 w-auto block dark:hidden" />
          </Link>
          <p>&copy; 2026 SERVLO Pty Ltd &nbsp;&middot;&nbsp; ABN: 88 688 301 684 &nbsp;&middot;&nbsp; ServiceM8 pricing sourced from servicem8.com</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
