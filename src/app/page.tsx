import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Shield,
  Wrench,
  Users,
  Star,
  Megaphone,
  Mic,
  Receipt,
  Lightbulb,
} from "lucide-react";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingPricing } from "@/components/landing/landing-pricing";

async function getFounderCount(): Promise<number> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";
    const res = await fetch(`${base}/api/founders/count`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json.count ?? json.total ?? 0);
  } catch {
    return 0;
  }
}

/** Simple inline sparkline using SVG */
function Sparkline() {
  const points = [8, 14, 10, 18, 13, 20, 16, 24, 19, 28].map(
    (y, i) => `${i * 11},${30 - y}`
  ).join(" ");
  return (
    <svg width="110" height="32" viewBox="0 0 110 32" fill="none" aria-hidden>
      <polyline points={points} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="99" cy="2" r="3" fill="#F59E0B" />
    </svg>
  );
}

export default async function HomePage() {
  const founderCount = await getFounderCount();
  const spotsRemaining = Math.max(0, 50 - founderCount);

  return (
    <div className="min-h-screen bg-[#050914] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050914]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="shrink-0">
            <Image
              src="/servlo-master-white.svg"
              alt="SERVLO"
              width={120}
              height={32}
              priority
              unoptimized
              className="drop-shadow-[0_0_28px_rgba(59,130,246,0.55)]"
            />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-400 md:flex">
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#platform" className="transition hover:text-white">Compare</a>
            <a href="#roadmap" className="transition hover:text-white">Roadmap</a>
            <Link href="/status" className="transition hover:text-white">Status</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden text-sm font-medium text-slate-300 transition hover:text-white md:block">
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-28 pt-20 md:px-6 md:pb-36 md:pt-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
          <div className="absolute -right-32 top-32 h-[400px] w-[400px] rounded-full bg-indigo-700/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2 md:gap-12">
          {/* Left */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300">
              &#9889; Built for Australian service businesses
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.06] tracking-tight text-white md:text-[68px]">
              Run your trade business like a pro.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
              Jobs. Quotes. Invoices. Team. Marketing. Leads. All in one place &mdash; built for Australian tradies,
              cleaners, landscapers, and field service businesses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
              >
                Start free &mdash; 30 days
                <ArrowRight size={16} />
              </Link>
              <a
                href="#platform"
                className="flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                See the platform
              </a>
            </div>
            <div className="mt-3">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-slate-400 transition hover:text-white"
              >
                Watch 2-min demo &rarr;
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">No credit card &nbsp;&middot;&nbsp; Cancel anytime &nbsp;&middot;&nbsp; Australian owned &amp; operated</p>

            {/* Stat row */}
            <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-8 text-sm">
              {[
                "No lock-in contracts",
                "Cheaper than ServiceM8 at 50+ jobs/mo",
                "AI tools competitors don’t have",
                "Built in Adelaide SA",
              ].map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-slate-400">
                  <Check size={13} className="text-blue-400" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1525] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)]">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-[#111f36]/90 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate text-xs font-medium text-slate-400">servlo.app &nbsp;&middot;&nbsp; Dashboard</span>
              </div>
              <div className="p-5">
                {/* Top stats */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-[#152238] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">This month</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-white">$12,450</p>
                    <div className="mt-2">
                      <Sparkline />
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#152238] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Jobs this week</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-white">14</p>
                    <p className="mt-1 text-xs text-emerald-400">&#9650; 3 vs last week</p>
                  </div>
                </div>

                {/* Job card */}
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#152238]">
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#1a2d47]/80 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-200 ring-1 ring-inset ring-emerald-500/30">
                        In Progress
                      </span>
                      <h3 className="mt-2 truncate text-sm font-bold text-white">Install GPOs &mdash; Mike&rsquo;s Plumbing</h3>
                      <p className="truncate text-xs text-slate-400">Norwood, SA &nbsp;&middot;&nbsp; 9:00 AM &ndash; 2:00 PM</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-extrabold tabular-nums text-blue-300">$1,920</p>
                      <p className="text-[10px] text-slate-400">Inc. GST</p>
                    </div>
                  </div>
                  {/* Invoice row */}
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                    <span className="font-mono text-slate-400">INV-0042</span>
                    <span className="text-slate-300">Sarah Chen</span>
                    <span className="font-semibold text-white">$1,840</span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
                      Paid
                    </span>
                  </div>
                </div>

                {/* AI status indicator */}
                <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-purple-500/25 bg-purple-500/10 px-3.5 py-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
                  </span>
                  <span className="text-xs font-medium text-purple-200">AI generating ad for &ldquo;emergency electrician Adelaide&rdquo;&hellip;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ───────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-5">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Built for every trade
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: "⚡", label: "Electricians" },
              { icon: "🔧", label: "Plumbers" },
              { icon: "❄️", label: "HVAC" },
              { icon: "🏗️", label: "Builders" },
              { icon: "🧹", label: "Cleaners" },
              { icon: "🌿", label: "Landscapers" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <span className="text-base">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-32 md:px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">The problem</span>
        </div>
        <h2 className="mx-auto max-w-2xl text-center text-4xl font-bold leading-tight text-white md:text-[52px] md:leading-[1.1]">
          Still running your business on paper and WhatsApp?
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              emoji: "💬",
              title: "Texting quotes to clients at 10pm",
              copy: "Send professional quotes clients approve online. No more chasing approvals over WhatsApp."
            },
            {
              emoji: "📄",
              title: "Invoicing from a spreadsheet",
              copy: "Invoice automatically on job completion. Get paid faster with Stripe payment links sent directly to clients."
            },
            {
              emoji: "📱",
              title: "Coordinating your crew on WhatsApp",
              copy: "Schedule your team with one tap. Everyone knows where to be and what job they’re on."
            }
          ].map(({ emoji, title, copy }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="text-3xl">{emoji}</span>
              <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-y border-white/[0.06] bg-white/[0.015] py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">How it works</span>
          </div>
          <h2 className="text-center text-4xl font-bold text-white md:text-[52px]">Up and running in minutes</h2>
          <div className="relative mt-16 grid gap-10 md:grid-cols-3">
            <div aria-hidden className="absolute left-[calc(33%+1rem)] right-[calc(33%+1rem)] top-8 hidden h-px bg-gradient-to-r from-blue-500/40 via-blue-500/60 to-blue-500/40 md:block" />
            {[
              {
                step: "01",
                title: "Set up in 10 minutes",
                copy: "Add your business, clients, and first job. Import existing data from any tool."
              },
              {
                step: "02",
                title: "Send your first quote today",
                copy: "Professional PDF quotes clients can approve and pay online. No back-and-forth."
              },
              {
                step: "03",
                title: "Start growing in week 1",
                copy: "AI writes your ads, responds to reviews, and surfaces leads in your area."
              }
            ].map(({ step, title, copy }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/15 text-lg font-bold text-blue-300">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE PRODUCTS ───────────────────────────────────────────────── */}
      <section id="platform" className="mx-auto max-w-7xl px-4 py-32 md:px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">The platform</span>
        </div>
        <h2 className="text-center text-4xl font-bold text-white md:text-[52px]">Three products, one login</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-slate-400">
          Start with Core to run your business. Add Grow to market it. Use Leads to fill your pipeline.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              logo: "/core.png",
              logoGlow: "drop-shadow-[0_0_16px_rgba(59,130,246,0.4)]",
              name: "SERVLO Core",
              color: "#3B82F6",
              badge: "Available now",
              badgeStyle: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
              perfectFor: "Sole traders, small crews, growing trade businesses",
              desc: "The complete job management platform — scheduling, invoicing, quoting, clients, timesheets and more.",
              features: [
                "Jobs & scheduling",
                "GST invoices & quotes",
                "Client CRM & portals",
                "Team timesheets",
                "AI receipt scanning for materials",
                "Digital signatures on site",
                "Client portal for quotes + payments",
                "Business dashboard"
              ]
            },
            {
              logo: "/grow.png",
              logoGlow: "drop-shadow-[0_0_16px_rgba(139,92,246,0.4)]",
              name: "SERVLO Grow",
              color: "#8B5CF6",
              badge: "Coming Q3 2026",
              badgeStyle: "bg-purple-500/20 text-purple-300 ring-purple-500/30",
              perfectFor: "Businesses wanting more jobs without paying for ads manually",
              desc: "AI-powered marketing — ads, review automation and social content so your phone keeps ringing.",
              features: [
                "AI Google/Meta ads",
                "Review request automation",
                "Social content generator",
                "Lead tracking",
                "Competitor insights"
              ]
            },
            {
              logo: "/leads.png",
              logoGlow: "drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]",
              name: "SERVLO Leads",
              color: "#F59E0B",
              badge: "Coming Q4 2026",
              badgeStyle: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
              perfectFor: "Tradies who want a steady flow of qualified work",
              desc: "Verified local job leads sent directly to you — only pay for leads that match your trade and area.",
              features: [
                "Verified homeowner leads",
                "Trade & area filters",
                "No subscription required",
                "Instant job alerts",
                "Lead quality guarantee"
              ]
            }
          ].map(({ logo, logoGlow, name, color, badge, badgeStyle, perfectFor, desc, features }) => (
            <div
              key={name}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20"
            >
              <div className="h-1 w-full" style={{ backgroundColor: color }} />
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="relative h-8 w-8 shrink-0">
                    <Image src={logo} alt={name} fill sizes="32px" className={`object-contain ${logoGlow ?? ""}`} unoptimized />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badgeStyle}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Perfect for: {perfectFor}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{desc}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={13} className="shrink-0 text-blue-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMING NEXT STRIP ────────────────────────────────────────────── */}
      <section id="roadmap" className="border-y border-white/[0.06] bg-white/[0.015] py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">Coming next</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { logo: "/answer.png", name: "Answer", desc: "AI phone agent", date: "Q3 2026" },
              { logo: "/pay.png",    name: "Pay",    desc: "Integrated payments", date: "Q4 2026" },
              { logo: "/hire.png",   name: "Hire",   desc: "Trade job board", date: "Q1 2027" },
              { logo: "/fleet.png",  name: "Fleet",  desc: "GPS tracking", date: "Q2 2027" },
              { logo: "/finance.png",name: "Finance",desc: "Business loans", date: "Q3 2027" },
            ].map(({ logo, name, desc, date }) => (
              <div
                key={name}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm"
              >
                <div className="relative h-5 w-5 shrink-0">
                  <Image src={logo} alt={name} fill sizes="20px" className="object-contain" unoptimized />
                </div>
                <span className="font-semibold text-white">{name}</span>
                <span className="text-slate-400">{desc}</span>
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">{date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── YOUR EDGE (AI) ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-32 md:px-6">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Your edge</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight text-white md:text-[52px] md:leading-[1.1]">
              The only Australian trade platform with built-in AI.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              SERVLO isn&apos;t just software &mdash; it uses AI to save you hours every week.
              Smart features that work behind the scenes so you can stay on the tools.
            </p>
            <ul className="mt-10 space-y-5">
              {[
                {
                  Icon: Megaphone,
                  title: "Generate a Google or Meta ad in 30 seconds",
                  copy: "Describe your service, AI writes the copy, you copy it in."
                },
                {
                  Icon: Star,
                  title: "AI responds to your Google reviews",
                  copy: "Professionally, in your tone, instantly."
                },
                {
                  Icon: Mic,
                  title: "Dictate job notes while you pack up",
                  copy: "AI turns voice into structured job records."
                },
                {
                  Icon: Receipt,
                  title: "Photograph a Bunnings receipt",
                  copy: "AI reads it and adds every item to your job materials list."
                },
                {
                  Icon: Lightbulb,
                  title: "AI spots clients who haven’t booked in 90 days",
                  copy: "And drafts a follow-up message for you to send with one tap."
                },
              ].map(({ Icon, title, copy }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                    <Icon size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock AI card */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-4 rounded-3xl bg-blue-600/10 blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0c1525] p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-base">&#10024;</span>
                <span className="text-sm font-semibold text-white">AI Quote Assistant</span>
                <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Live</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#152238] p-4 text-sm text-slate-300">
                <p className="text-slate-400 italic">&ldquo;Replace switchboard in commercial building, 3 phase, estimate 6 hours labour plus materials&rdquo;</p>
              </div>
              <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Generated quote</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Labour (6 hrs @ $95/hr)</span>
                    <span className="font-semibold text-white">$570.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">3-phase switchboard (Clipsal)</span>
                    <span className="font-semibold text-white">$1,240.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Misc. materials</span>
                    <span className="font-semibold text-white">$180.00</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-bold">
                    <span className="text-white">Total inc. GST</span>
                    <span className="text-blue-300">$2,189.00</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
                Send to client &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-y border-white/[0.06] bg-white/[0.015] py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pricing</span>
          </div>
          <h2 className="text-center text-4xl font-bold text-white md:text-[52px]">
            Simple pricing. No surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-slate-400">
            Early adopters lock in the founding rate &mdash; your price never increases while your subscription is active.
          </p>
          <div className="mt-12">
            <LandingPricing />
          </div>
        </div>
      </section>

      {/* ── NO LOCK-IN ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-32 md:px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Our promise</span>
        </div>
        <h2 className="text-center text-4xl font-bold text-white md:text-[52px]">Your data. Your business. Your call.</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              Icon: Shield,
              title: "Cancel in one click",
              copy: "From Settings → Billing. No phone calls. No retention team. No waiting period. Just cancelled."
            },
            {
              Icon: Wrench,
              title: "Export everything, anytime",
              copy: "One button downloads every client, job, invoice, and photo as a ZIP file you own forever."
            },
            {
              Icon: Users,
              title: "We’ll even help you leave",
              copy: "We have step-by-step migration guides to ServiceM8, Tradify, Jobber, and simPRO. We’re that confident."
            }
          ].map(({ Icon, title, copy }) => (
            <div
              key={title}
              className="flex flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] p-7"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                <Icon size={18} className="text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.015] py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">FAQ</span>
          </div>
          <h2 className="mb-14 text-center text-4xl font-bold text-white md:text-[52px]">Common questions</h2>
          <LandingFaq />
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-32 md:px-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          {founderCount > 0 && (
            <p className="mb-5 text-sm font-medium text-slate-400">
              Join{" "}
              <span className="font-bold text-white">{founderCount.toLocaleString()}</span>{" "}
              Australian businesses already on SERVLO
            </p>
          )}
          <h2 className="text-4xl font-extrabold leading-tight text-white md:text-[56px] md:leading-[1.06]">
            Stop leaving money on the table.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
            Every week you spend on admin instead of SERVLO is a week of missed invoices,
            lost quotes, and jobs you forgot to follow up on.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
            >
              Start free &mdash; 30 days
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/auth/signup?plan=solo&code=EARLYACCESS"
              className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-8 py-4 text-base font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              Claim 75% off &mdash; Founding 100
            </Link>
          </div>
          {spotsRemaining > 0 && (
            <p className="mt-5 text-sm font-medium text-slate-400">
              <span className="font-bold text-amber-300">{spotsRemaining} of 50</span> founding spots remain.
              After that, full price only.
            </p>
          )}
          <p className="mt-4 text-sm text-slate-500">
            Built in Adelaide SA &nbsp;&middot;&nbsp; ABN 88 688 301 684
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#030711] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <Image
                  src="/servlo-master-white.svg"
                  alt="SERVLO"
                  width={100}
                  height={28}
                  unoptimized
                  className="drop-shadow-[0_0_28px_rgba(59,130,246,0.55)]"
                />
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                The operating system for Australian service businesses.
              </p>
              <p className="mt-3 text-xs text-slate-500">ABN: 88 688 301 684</p>
            </div>

            {/* Product */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Product</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#platform" className="transition hover:text-white">Platform overview</a></li>
                <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
                <li><a href="#roadmap" className="transition hover:text-white">Roadmap</a></li>
                <li><Link href="/status" className="transition hover:text-white">System status</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Company</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="mailto:hello@servlo.com.au" className="transition hover:text-white">Contact us</a></li>
                <li><Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="transition hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Get started */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Get started</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/auth/signup" className="transition hover:text-white">Start free trial</Link></li>
                <li><Link href="/auth/login" className="transition hover:text-white">Log in</Link></li>
              </ul>
              <div className="mt-5">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Start free trial
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/[0.06] pt-8 text-center text-xs text-slate-500">
            &copy; 2026 SERVLO Pty Ltd. All rights reserved. Built in Adelaide, South Australia.
          </div>
        </div>
      </footer>
    </div>
  );
}
