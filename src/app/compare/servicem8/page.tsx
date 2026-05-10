"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, X, ArrowRight, Minus } from "lucide-react";

// ServiceM8 plan tiers
function getServiceM8Plan(jobs: number): { name: string; price: number } {
  if (jobs <= 5)   return { name: "Free",         price: 0   };
  if (jobs <= 15)  return { name: "Lite",          price: 9   };
  if (jobs <= 50)  return { name: "Starter",       price: 29  };
  if (jobs <= 150) return { name: "Growing",       price: 79  };
  if (jobs <= 500) return { name: "Premium",       price: 149 };
  return             { name: "Premium Plus",    price: 349 };
}

const SERVLO_SOLO = 39;

const FEATURES: Array<{
  label: string;
  servlo: string | true | false;
  sm8: string | true | false;
  servloWins?: boolean;
}> = [
  { label: "Job management",               servlo: true,           sm8: true },
  { label: "Quoting & invoicing",          servlo: true,           sm8: true },
  { label: "Client management",           servlo: true,           sm8: true },
  { label: "Unlimited users (all plans)", servlo: true,           sm8: true },
  { label: "Australian GST/BAS support",  servlo: true,           sm8: true },
  { label: "AI ad generation",            servlo: true,           sm8: false, servloWins: true },
  { label: "AI receipt scanning",         servlo: true,           sm8: false, servloWins: true },
  { label: "AI review responses",         servlo: true,           sm8: false, servloWins: true },
  { label: "AI quote generation",         servlo: true,           sm8: true  },
  { label: "Lead marketplace",            servlo: "Coming Q4 2026", sm8: false, servloWins: true },
  { label: "Xero integration",            servlo: "Coming Q3 2026", sm8: true },
  { label: "Native iOS app",              servlo: "Coming Q3 2026", sm8: true },
  { label: "Offline mode",               servlo: "Coming Q3 2026", sm8: true },
  { label: "1-click cancel",             servlo: true,           sm8: false, servloWins: true },
  { label: "Full data export",           servlo: true,           sm8: "Partial" },
  { label: "Price model",               servlo: "Unlimited jobs", sm8: "Per job tier" },
  { label: "Australian-built",          servlo: true,           sm8: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check size={18} className="mx-auto text-emerald-400" />;
  if (value === false) return <X size={18} className="mx-auto text-red-400" />;
  if (value === "Partial") return <Minus size={18} className="mx-auto text-amber-400" />;
  return <span className="text-xs text-amber-300">{value}</span>;
}

export default function CompareSM8Page() {
  const [jobs, setJobs] = useState(60);
  const sm8 = getServiceM8Plan(jobs);
  const monthlySaving = Math.max(0, sm8.price - SERVLO_SOLO);
  const annualSaving  = monthlySaving * 12;
  const servloWins    = SERVLO_SOLO < sm8.price;

  return (
    <div className="min-h-screen bg-[#050914] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050914]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="shrink-0">
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={100} height={28} unoptimized
              className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/compare" className="text-sm text-slate-400 transition hover:text-white">All comparisons</Link>
            <Link href="/auth/signup" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">

        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Comparison</p>
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">
            SERVLO vs ServiceM8
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            An honest, side-by-side comparison. SERVLO wins on price at 51+ jobs/month.
            ServiceM8 wins on maturity and integrations — we say that openly.
          </p>
        </div>

        {/* Savings calculator */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-1 text-xl font-bold text-white">How much could you save?</h2>
          <p className="mb-8 text-sm text-slate-400">Drag the slider to your monthly job volume.</p>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">Jobs per month</span>
            <span className="text-xl font-bold text-white">{jobs}</span>
          </div>
          <input
            type="range"
            min={1}
            max={500}
            value={jobs}
            onChange={(e) => setJobs(Number(e.target.value))}
            className="mb-8 w-full accent-blue-500"
          />

          <div className="grid gap-5 md:grid-cols-3">
            {/* ServiceM8 */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">ServiceM8</p>
              <p className="text-sm font-medium text-slate-300">{sm8.name} plan</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">${sm8.price}</p>
              <p className="text-xs text-slate-400">/mo</p>
            </div>

            {/* SERVLO */}
            <div className={`rounded-xl border p-5 ${servloWins ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-white/[0.04]"}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">SERVLO Solo</p>
              <p className="text-sm font-medium text-slate-300">Always same price</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">${SERVLO_SOLO}</p>
              <p className="text-xs text-slate-400">/mo</p>
            </div>

            {/* Saving */}
            <div className={`rounded-xl border p-5 ${servloWins ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.04]"}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {servloWins ? "Your saving with SERVLO" : "ServiceM8 is cheaper"}
              </p>
              <p className="text-sm font-medium text-slate-300">per month</p>
              <p className={`mt-2 text-3xl font-extrabold tabular-nums ${servloWins ? "text-emerald-400" : "text-slate-300"}`}>
                {servloWins ? `$${monthlySaving}` : "$0"}
              </p>
              {servloWins && annualSaving > 0 && (
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  ${annualSaving.toLocaleString()} saved per year
                </p>
              )}
            </div>
          </div>

          {jobs <= 50 ? (
            <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              At {jobs} jobs/mo, ServiceM8 {sm8.price === 0 ? "Free tier" : sm8.name} (${sm8.price}) is cheaper than SERVLO Solo (${SERVLO_SOLO}).
              SERVLO becomes the better deal at 51+ jobs — plus you get AI tools that ServiceM8 doesn&apos;t have.
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              At {jobs} jobs/mo you need ServiceM8 {sm8.name} (${sm8.price}/mo). SERVLO Solo costs ${SERVLO_SOLO}/mo — you save{" "}
              <strong>${monthlySaving}/mo (${annualSaving}/yr)</strong> and get AI tools on top.
            </div>
          )}
        </section>

        {/* Feature table */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-white">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-4 text-left font-semibold text-slate-300">Feature</th>
                  <th className="px-5 py-4 text-center font-semibold text-blue-300">SERVLO</th>
                  <th className="px-5 py-4 text-center font-semibold text-slate-400">ServiceM8</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {FEATURES.map(({ label, servlo, sm8: sm8val, servloWins: sw }) => (
                  <tr key={label} className={`transition hover:bg-white/[0.02] ${sw ? "bg-emerald-500/[0.03]" : ""}`}>
                    <td className="px-5 py-3.5 text-slate-300">{label}</td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={servlo} /></td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={sm8val} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Where ServiceM8 wins — honest section */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h2 className="mb-4 text-xl font-bold text-white">Where ServiceM8 still wins</h2>
          <p className="mb-6 text-sm text-slate-400">
            We&apos;re honest about this. ServiceM8 has been around longer and has advantages we don&apos;t yet match.
          </p>
          <ul className="space-y-3">
            {[
              "More reviews and a proven track record across thousands of Australian tradies",
              "Larger compliance forms library (250+ forms vs our 20)",
              "Native iOS app with full offline mode — critical for rural areas",
              "Larger ecosystem of third-party integrations",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-slate-400">
            If offline mode or a large forms library is critical to your workflow today, ServiceM8 may be the right call.
            If you&apos;re prioritising AI features, price, and a platform being built for the next 10 years — try SERVLO.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-10 text-center">
          <h2 className="text-2xl font-bold text-white">Try SERVLO free — cancel anytime in one click</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            30-day free trial. No credit card required. If you don&apos;t love it, cancel from Settings → Billing.
            One click. No phone call.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-blue-400"
          >
            Start free trial
            <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            Or <Link href="/compare" className="text-blue-400 hover:text-blue-300">compare SERVLO with Tradify</Link>
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
        &copy; 2026 SERVLO Pty Ltd &nbsp;&middot;&nbsp; ABN: 88 688 301 684 &nbsp;&middot;&nbsp;
        <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
        &nbsp;&middot;&nbsp;
        <Link href="/terms" className="hover:text-slate-300">Terms</Link>
      </footer>
    </div>
  );
}
