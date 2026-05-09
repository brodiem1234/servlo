import Image from "next/image";
import Link from "next/link";
import { Check, Zap, Shield, ArrowRight, Star, Wrench, Sparkles, Phone, CreditCard, Users } from "lucide-react";
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

export default async function HomePage() {
  const founderCount = await getFounderCount();

  return (
    <div className="min-h-screen bg-[#050914] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050914]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/servlo-master-white.svg"
              alt="SERVLO"
              width={120}
              height={32}
              priority
              unoptimized
            />
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-400 md:flex">
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#platform" className="transition hover:text-white">Compare</a>
            <a href="#roadmap" className="transition hover:text-white">Roadmap</a>
            <Link href="/status" className="transition hover:text-white">Status</Link>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden text-sm font-medium text-slate-300 transition hover:text-white md:block"
            >
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
      <section className="relative overflow-hidden px-4 pb-24 pt-20 md:px-6 md:pb-32 md:pt-28">
        {/* Background glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute -right-32 top-32 h-[400px] w-[400px] rounded-full bg-indigo-700/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2 md:gap-10">
          {/* Left */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300">
              <Zap size={12} className="fill-blue-400 text-blue-400" />
              Built for Australian service businesses
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-[72px]">
              Run your trade business like a pro.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
              Jobs, invoices, scheduling, clients and team — all in one place.
              No spreadsheets, no WhatsApp groups, no missed payments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
              >
                Start free — 30 days
                <ArrowRight size={16} />
              </Link>
              <a
                href="#platform"
                className="flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                See the platform
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">No credit card · Cancel anytime · Australian owned &amp; operated</p>

            {/* Stat row */}
            <div className="mt-10 flex flex-wrap gap-8 border-t border-white/10 pt-8">
              {[
                { value: "10 min", label: "to set up your account" },
                { value: "100%", label: "GST-ready invoicing" },
                { value: "1 login", label: "for your whole team" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent blur-2xl"
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1525] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)]">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-[#111f36]/90 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate text-xs font-medium text-slate-400">servlo.app · Jobs</span>
              </div>
              <div className="p-5">
                {/* Header row */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Today</p>
                    <p className="text-lg font-bold text-white">Wed 7 May</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/15 px-3 py-1.5 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300">This week</p>
                    <p className="text-sm font-bold tabular-nums text-white">12 jobs</p>
                  </div>
                </div>
                {/* Job card */}
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#152238]">
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#1a2d47]/80 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-200 ring-1 ring-inset ring-blue-400/30">
                        In progress
                      </span>
                      <h3 className="mt-2 truncate text-base font-bold text-white">Switchboard upgrade</h3>
                      <p className="truncate text-sm text-slate-300">Norwood Community Centre</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-extrabold tabular-nums tracking-tight text-blue-300">$4,850</p>
                      <p className="text-[11px] text-slate-400">Inc. GST · Approved</p>
                    </div>
                  </div>
                  <div className="grid gap-3 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Scheduled</span>
                      <span className="font-medium text-slate-200">9:00 AM – 3:00 PM</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-500/30">Paid deposit</span>
                      <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-500/30">Materials on site</span>
                    </div>
                  </div>
                </div>
                {/* Mini stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-[#152238]/90 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Outstanding</p>
                    <p className="text-lg font-bold tabular-nums text-white">$12,450</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#152238]/90 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">This month</p>
                    <p className="text-lg font-bold tabular-nums text-blue-300">$48.2k</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ───────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-5">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
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
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">The problem</span>
        </div>
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight text-white md:text-4xl">
          Still running your business on paper and WhatsApp?
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              emoji: "💸",
              title: "Chasing unpaid invoices at midnight",
              copy: "Cashflow suffers when follow-ups fall behind. SERVLO sends automated reminders so you get paid faster."
            },
            {
              emoji: "📲",
              title: "Texting job details to employees one by one",
              copy: "Manual updates waste time and create mistakes. Assign jobs in seconds — your team sees it instantly on mobile."
            },
            {
              emoji: "📬",
              title: "Losing quotes in your email inbox",
              copy: "Missed follow-up means missed revenue. Every quote lives in SERVLO with status tracking and one-click send."
            }
          ].map(({ emoji, title, copy }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="text-3xl">{emoji}</span>
              <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.015] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">How it works</span>
          </div>
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Up and running in minutes</h2>
          <div className="relative mt-14 grid gap-10 md:grid-cols-3">
            {/* Connecting line on desktop */}
            <div aria-hidden className="absolute left-[calc(33%+1rem)] right-[calc(33%+1rem)] top-8 hidden h-px bg-gradient-to-r from-blue-500/40 via-blue-500/60 to-blue-500/40 md:block" />
            {[
              { step: "01", title: "Sign up & pick your industry", copy: "Tell us your trade — we personalise your dashboard instantly. No generic setup wizard." },
              { step: "02", title: "Add your clients, jobs & team", copy: "Import from a spreadsheet or start fresh. Invite employees with a single link." },
              { step: "03", title: "Run your business from one screen", copy: "Schedule jobs, send invoices, track hours and follow up clients — all without switching apps." }
            ].map(({ step, title, copy }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/15 text-lg font-bold text-blue-300">
                  {step}
                </div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE PRODUCTS ───────────────────────────────────────────────── */}
      <section id="platform" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">The platform</span>
        </div>
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Three products, one login</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-slate-400">
          Start with Core to run your business. Add Grow to market it. Use Leads to fill your pipeline.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              logo: "/core.png",
              name: "SERVLO Core",
              color: "#3B82F6",
              badge: "Available now",
              badgeStyle: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
              desc: "The complete job management platform — scheduling, invoicing, quoting, clients, timesheets and more.",
              features: ["Jobs & scheduling", "GST invoices & quotes", "Client CRM & portals", "Team timesheets", "Business dashboard"]
            },
            {
              logo: "/grow.png",
              name: "SERVLO Grow",
              color: "#8B5CF6",
              badge: "Coming Q3 2026",
              badgeStyle: "bg-purple-500/20 text-purple-300 ring-purple-500/30",
              desc: "AI-powered marketing — ads, review automation and social content so your phone keeps ringing.",
              features: ["AI Google/Meta ads", "Review request automation", "Social content generator", "Lead tracking", "Competitor insights"]
            },
            {
              logo: "/leads.png",
              name: "SERVLO Leads",
              color: "#F59E0B",
              badge: "Coming Q4 2026",
              badgeStyle: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
              desc: "Verified local job leads sent directly to you — only pay for leads that match your trade and area.",
              features: ["Verified homeowner leads", "Trade & area filters", "No subscription required", "Instant job alerts", "Lead quality guarantee"]
            }
          ].map(({ logo, name, color, badge, badgeStyle, desc, features }) => (
            <div
              key={name}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20"
            >
              <div className="h-1 w-full" style={{ backgroundColor: color }} />
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="relative h-8 w-8">
                    <Image src={logo} alt={name} fill className="object-contain" unoptimized />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badgeStyle}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
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
      <section id="roadmap" className="border-y border-white/[0.06] bg-white/[0.015] py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Coming next</p>
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
                  <Image src={logo} alt={name} fill className="object-contain" unoptimized />
                </div>
                <span className="font-semibold text-white">{name}</span>
                <span className="text-slate-400">{desc}</span>
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">{date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI DIFFERENTIATOR ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">AI-powered</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              Your AI business assistant, built in
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              SERVLO isn&apos;t just software — it uses AI to save you hours every week.
              From drafting quotes to answering client calls, the smart features work behind the scenes.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { Icon: Sparkles, title: "Smart quote drafting", copy: "Describe the job, get a professional quote in seconds" },
                { Icon: Phone, title: "AI phone agent (Answer)", copy: "Never miss a lead — AI answers calls and books jobs for you" },
                { Icon: Star, title: "Review automation (Grow)", copy: "Auto-request reviews at job completion, boost your Google ranking" },
                { Icon: CreditCard, title: "Cashflow forecasting", copy: "Predict your next 30/60/90 days based on job and invoice data" },
              ].map(({ Icon, title, copy }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                    <Icon size={15} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-sm text-slate-400">{copy}</p>
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
                <Sparkles size={16} className="text-blue-400" />
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
                  <div className="mt-2 border-t border-white/10 pt-2 flex justify-between font-bold">
                    <span className="text-white">Total inc. GST</span>
                    <span className="text-blue-300">$2,189.00</span>
                  </div>
                </div>
              </div>
              <button className="mt-3 w-full rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
                Send to client →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-y border-white/[0.06] bg-white/[0.015] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Pricing</span>
          </div>
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Simple pricing. No surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-slate-400">
            Early adopters lock in the founding rate — price never increases while your subscription is active.
          </p>
          <div className="mt-12">
            <LandingPricing />
          </div>
        </div>
      </section>

      {/* ── NO LOCK-IN ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Our promise</span>
        </div>
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Your data. Your business. Your call.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              Icon: Shield,
              title: "No lock-in contracts",
              copy: "Month-to-month or annual — cancel from settings at any time with no exit fees, no questions asked."
            },
            {
              Icon: Wrench,
              title: "Export everything, anytime",
              copy: "Your clients, jobs, invoices and data can be exported to CSV or PDF at any time. It&apos;s your data."
            },
            {
              Icon: Users,
              title: "Price locked for life",
              copy: "Sign up today and your plan price is locked in forever. We reward early adopters — not punish them."
            }
          ].map(({ Icon, title, copy }) => (
            <div
              key={title}
              className="flex flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                <Icon size={18} className="text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400"
                 dangerouslySetInnerHTML={{ __html: copy.replace(/&apos;/g, "'") }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.015] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">FAQ</span>
          </div>
          <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">Common questions</h2>
          <LandingFaq />
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-24 md:px-6 md:py-32">
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
          <h2 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Ready to run your business smarter?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-slate-400">
            Start your 30-day free trial. No credit card. No commitment.
            Personalised to your trade from day one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
            >
              Start free — 30 days
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Built in Adelaide SA · Australian owned · ABN 88 688 301 684
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#030711] py-14">
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
            © 2026 SERVLO Pty Ltd. All rights reserved. Built in Adelaide, South Australia.
          </div>
        </div>
      </footer>
    </div>
  );
}
