"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, X, ArrowRight, Minus } from "lucide-react";

// Tradify plan pricing (approximate as of 2026)
function getTradifyPlan(users: number): { name: string; price: number } {
  if (users <= 1) return { name: "Solo",     price: 29 };
  if (users <= 5) return { name: "Starter",  price: 55 };
  return            { name: "Premium",   price: 89 };
}

const SERVLO_TEAM = 89; // unlimited users

const FEATURES: Array<{
  label: string;
  servlo: string | true | false;
  tradify: string | true | false;
  servloWins?: boolean;
}> = [
  { label: "Job management",               servlo: true,              tradify: true },
  { label: "Quoting & invoicing",          servlo: true,              tradify: true },
  { label: "Client management",           servlo: true,              tradify: true },
  { label: "Unlimited users — all plans", servlo: true,              tradify: false, servloWins: true },
  { label: "Australian GST/BAS support",  servlo: true,              tradify: true },
  { label: "AI ad generation",            servlo: true,              tradify: false, servloWins: true },
  { label: "AI receipt scanning",         servlo: true,              tradify: false, servloWins: true },
  { label: "AI review responses",         servlo: true,              tradify: false, servloWins: true },
  { label: "AI quote generation",         servlo: true,              tradify: "Basic" },
  { label: "Lead marketplace",            servlo: "Coming Q4 2026",  tradify: false, servloWins: true },
  { label: "Xero/MYOB integration",       servlo: "Coming Q3 2026",  tradify: true },
  { label: "Native iOS & Android app",    servlo: "Coming Q3 2026",  tradify: true },
  { label: "Offline mode",               servlo: "Coming Q3 2026",  tradify: true },
  { label: "1-click cancel",             servlo: true,              tradify: false, servloWins: true },
  { label: "Full data export",           servlo: true,              tradify: "Partial" },
  { label: "Price model",               servlo: "Unlimited users",  tradify: "Per user" },
  { label: "Australian-built",          servlo: true,              tradify: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true)    return <Check size={18} className="mx-auto text-emerald-400" />;
  if (value === false)   return <X size={18} className="mx-auto text-red-400" />;
  if (value === "Partial" || value === "Basic")
    return <Minus size={18} className="mx-auto text-amber-400" />;
  return <span className="text-xs text-amber-300">{value}</span>;
}

export default function CompareTradifyPage() {
  const [users, setUsers] = useState(3);
  const tradify = getTradifyPlan(users);
  const monthlySaving = Math.max(0, tradify.price - SERVLO_TEAM);
  const annualSaving  = monthlySaving * 12;
  const servloWins    = SERVLO_TEAM <= tradify.price;

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
            SERVLO vs Tradify
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Tradify prices per user. SERVLO Team includes unlimited users for $89/mo flat.
            Plus AI tools Tradify doesn&apos;t offer.
          </p>
        </div>

        {/* Calculator */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-1 text-xl font-bold text-white">How much could you save?</h2>
          <p className="mb-8 text-sm text-slate-400">Drag the slider to your team size.</p>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">Team members</span>
            <span className="text-xl font-bold text-white">{users}</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={users}
            onChange={(e) => setUsers(Number(e.target.value))}
            className="mb-8 w-full accent-blue-500"
          />

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Tradify</p>
              <p className="text-sm font-medium text-slate-300">{tradify.name} — {users} user{users > 1 ? "s" : ""}</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">~${tradify.price}</p>
              <p className="text-xs text-slate-400">/mo (approx)</p>
            </div>

            <div className={`rounded-xl border p-5 ${servloWins ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-white/[0.04]"}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">SERVLO Team</p>
              <p className="text-sm font-medium text-slate-300">Unlimited users</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">${SERVLO_TEAM}</p>
              <p className="text-xs text-slate-400">/mo</p>
            </div>

            <div className={`rounded-xl border p-5 ${servloWins && monthlySaving > 0 ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.04]"}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {servloWins && monthlySaving > 0 ? "Your saving with SERVLO" : "Similar pricing"}
              </p>
              <p className="text-sm font-medium text-slate-300">per month</p>
              <p className={`mt-2 text-3xl font-extrabold tabular-nums ${servloWins && monthlySaving > 0 ? "text-emerald-400" : "text-slate-300"}`}>
                {monthlySaving > 0 ? `$${monthlySaving}` : "~$0"}
              </p>
              {annualSaving > 0 && <p className="mt-1 text-sm font-semibold text-emerald-300">${annualSaving.toLocaleString()} saved/yr</p>}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-200">
            With SERVLO Team you can add unlimited employees, contractors and admins with no per-seat charge — ever.
          </div>
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
                  <th className="px-5 py-4 text-center font-semibold text-slate-400">Tradify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {FEATURES.map(({ label, servlo, tradify: tv, servloWins: sw }) => (
                  <tr key={label} className={`transition hover:bg-white/[0.02] ${sw ? "bg-emerald-500/[0.03]" : ""}`}>
                    <td className="px-5 py-3.5 text-slate-300">{label}</td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={servlo} /></td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell value={tv} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Honest section */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h2 className="mb-4 text-xl font-bold text-white">Where Tradify still wins</h2>
          <ul className="space-y-3">
            {[
              "Native mobile apps with offline mode for areas with poor connectivity",
              "Well-established platform with a large Australian user base",
              "Xero and MYOB integrations are live and battle-tested",
              "More compliance and inspection form templates",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-10 text-center">
          <h2 className="text-2xl font-bold text-white">Try SERVLO free — cancel anytime in one click</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            30-day free trial. No credit card. If it&apos;s not right, cancel from Settings → Billing. One click.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-blue-400"
          >
            Start free trial
            <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            Or <Link href="/compare/servicem8" className="text-blue-400 hover:text-blue-300">compare SERVLO with ServiceM8</Link>
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
        &copy; 2026 SERVLO Pty Ltd &nbsp;&middot;&nbsp; ABN: 88 688 301 684
        &nbsp;&middot;&nbsp; Tradify pricing shown is approximate.
      </footer>
    </div>
  );
}
