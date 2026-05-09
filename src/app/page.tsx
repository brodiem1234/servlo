import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  FileText,
  UserCog,
  LayoutDashboard,
  Camera,
  CircleDollarSign,
  MessagesSquare,
  Inbox,
  TrendingUp,
  Zap,
  Briefcase,
  Lock,
  type LucideIcon
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingIndustryTiles } from "@/components/landing-industry-tiles";
import { LandingIndustryDeepSections } from "@/components/landing-industry-deep-sections";
import { LandingScrollReveal } from "@/components/landing-scroll-reveal";
import { PricingWithEnterprise } from "@/components/marketing/pricing-with-enterprise";

const tealIcon = "text-[var(--accent-color)] dark:text-cyan-400";

const painPoints: Array<{ Icon: LucideIcon; title: string; copy: string }> = [
  {
    Icon: CircleDollarSign,
    title: "Chasing unpaid invoices at midnight",
    copy: "Cashflow suffers when follow-ups fall behind."
  },
  {
    Icon: MessagesSquare,
    title: "Texting job details to employees one by one",
    copy: "Manual updates waste time and create mistakes."
  },
  {
    Icon: Inbox,
    title: "Losing quotes in your email inbox",
    copy: "Missed follow-up means missed revenue."
  }
];

const features: Array<{ Icon: LucideIcon; title: string; description: string }> = [
  {
    Icon: CalendarDays,
    title: "Jobs & Scheduling",
    description: "Shared calendars, assignments and statuses everyone can see in real time"
  },
  {
    Icon: Users,
    title: "Client Management",
    description: "Central CRM with history, portals and reminders so nothing slips through"
  },
  {
    Icon: FileText,
    title: "Invoices & Quotes",
    description: "GST-ready PDFs, email delivery and faster approvals — no generic templates"
  },
  {
    Icon: UserCog,
    title: "Team & Rosters",
    description: "Clock in/out, timesheets and clear ownership on every booking"
  },
  {
    Icon: LayoutDashboard,
    title: "Business Dashboard",
    description: "Revenue, margins and aged debt at a glance — built for operators, not analysts"
  },
  {
    Icon: Camera,
    title: "Proof & Photos",
    description: "Before/after and on-site evidence attached to every job for disputes and QA"
  }
];



function HeroAppMock() {
  return (
    <div className="relative mx-auto w-full max-w-lg md:max-w-none">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[color-mix(in_srgb,var(--accent-color)_25%,transparent)] via-cyan-400/10 to-[#1e3a5f]/20 blur-2xl dark:from-cyan-400/20 dark:via-teal-500/10 dark:to-[#0f172a]/40"
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 dark:border-cyan-400/25 dark:bg-[#0c1525] dark:shadow-[0_28px_90px_-16px_rgba(0,0,0,0.65)] dark:ring-white/10">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-[#111f36]/90">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-xs font-medium text-slate-500 dark:text-slate-400">servlo.app · Jobs</span>
        </div>

        <div className="bg-gradient-to-b from-slate-50 to-white p-5 dark:from-[#0f172a] dark:to-[#0c1525]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Today</p>
              <p className="text-lg font-bold text-[#1e3a5f] dark:text-white">Wed 7 May</p>
            </div>
            <div className="rounded-lg bg-[color-mix(in_srgb,var(--accent-color)_15%,transparent)] px-3 py-1.5 text-right dark:bg-cyan-400/15">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-color)] dark:text-cyan-200">This week</p>
              <p className="text-sm font-bold tabular-nums text-[#1e3a5f] dark:text-white">12 jobs</p>
            </div>
          </div>

          <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-8px_rgba(30,58,95,0.25)] dark:border-white/10 dark:bg-[#152238] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-[#1a2d47]/80">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-400/30">
                  In progress
                </span>
                <h3 className="mt-2 truncate text-base font-bold text-[#1e3a5f] dark:text-white">Switchboard upgrade</h3>
                <p className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">Norwood Community Centre</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-extrabold tabular-nums tracking-tight text-[var(--accent-color)] dark:text-cyan-300">$4,850</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Inc. GST · Approved</p>
              </div>
            </div>
            <div className="grid gap-3 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Client</span>
                <span className="truncate font-semibold text-[#1e3a5f] dark:text-white">Brightspark Electrical Pty Ltd</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Scheduled</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">9:00 AM – 3:00 PM</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-500/30">
                  Paid deposit
                </span>
                <span className="inline-flex rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/30">
                  Materials on site
                </span>
              </div>
            </div>
          </article>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-[#152238]/90">
              <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Outstanding</p>
              <p className="text-lg font-bold tabular-nums text-[#1e3a5f] dark:text-white">$12,450</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-[#152238]/90">
              <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">This month</p>
              <p className="text-lg font-bold tabular-nums text-[var(--accent-color)] dark:text-cyan-300">$48.2k</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen scroll-smooth bg-slate-50 text-[#1e3a5f] [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif] dark:bg-[#0a0f1e] dark:text-white">
      <LandingScrollReveal />
      <LandingHeader />

      <section className="reveal-item bg-[#f1f5f9] dark:bg-[#0d1b36]" data-reveal>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-[#1e3a5f] dark:text-white md:text-6xl">
              The Complete Platform for Australian Service Businesses
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[#475569] dark:text-cyan-100">
              Manage your work, grow your marketing, and fill your pipeline — three products, one platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/signup"
                className="rounded-lg bg-[var(--accent-color)] px-6 py-3 text-base font-semibold text-white shadow-md shadow-[color-mix(in_srgb,var(--accent-color)_25%,transparent)] hover:bg-[var(--accent-hover)] dark:text-[#0f172a] dark:bg-cyan-400 dark:shadow-cyan-400/20 dark:hover:bg-cyan-300"
              >
                Start 30-Day Free Trial
              </Link>
              <a
                href="#features"
                className="rounded-lg border-2 border-[var(--accent-color)] bg-white px-6 py-3 text-base font-semibold text-[#1e3a5f] shadow-sm hover:bg-slate-50 dark:border-cyan-300/60 dark:bg-[#1e3a5f]/80 dark:text-white dark:shadow-none dark:hover:bg-[#256090]"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-sm text-[#64748b] dark:text-cyan-100/90">
              No credit card required • Cancel anytime • Australian owned
            </p>
          </div>
          <HeroAppMock />
        </div>
      </section>

      {/* ── The complete platform ───────────────────────────────────────────── */}
      <section id="platform" className="reveal-item mx-auto max-w-7xl px-4 py-16 md:px-6" data-reveal>
        <div className="mb-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-color)] dark:text-cyan-400">
            Twelve products, one platform
          </span>
        </div>
        <h2 className="text-center text-3xl font-bold text-[#1e3a5f] dark:text-white">
          The complete SERVLO platform
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-[#475569] dark:text-slate-300">
          Start with Core to run your business. Add Grow to market it. Use Leads to fill your pipeline.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Row 1 — Active products */}
          {[
            { name: "SERVLO Core",  color: "#3B82F6", desc: "Job management, invoicing, scheduling",          badge: "Available now",   badgeClass: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30", available: true  },
            { name: "SERVLO Grow",  color: "#8B5CF6", desc: "AI ads, reviews and social content",             badge: "Coming Q3 2026",  badgeClass: "bg-purple-100 text-purple-700 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/30", available: false },
            { name: "SERVLO Leads", color: "#F59E0B", desc: "Verified job leads marketplace",                 badge: "Coming Q4 2026",  badgeClass: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30", available: false },
            /* Row 2 */
            { name: "SERVLO Answer",   color: "#14B8A6", desc: "AI phone agent — answers calls, books jobs",  badge: "Q3 2026",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            { name: "SERVLO Pay",      color: "#22C55E", desc: "Integrated payment processing for every job", badge: "Q4 2026",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            { name: "SERVLO Hire",     color: "#F97316", desc: "Find tradies or find work — trade job board", badge: "Q1 2027",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            /* Row 3 */
            { name: "SERVLO Fleet",    color: "#0EA5E9", desc: "GPS tracking for vehicles and equipment",     badge: "Q2 2027",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            { name: "SERVLO Finance",  color: "#6366F1", desc: "Business loans and invoice financing",         badge: "Q3 2027",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            { name: "SERVLO Insurance",color: "#F43F5E", desc: "Embedded tradie insurance, quoted instantly",  badge: "Q4 2027",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            /* Row 4 */
            { name: "SERVLO Safe",     color: "#EF4444", desc: "Safety compliance, incidents and toolbox talks", badge: "Q2 2027", badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            { name: "SERVLO Books",    color: "#10B981", desc: "Bookkeeping, BAS lodgement and expenses",     badge: "Q3 2027",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
            { name: "SERVLO Academy",  color: "#EAB308", desc: "Trade training, compliance and licences",     badge: "Q1 2028",  badgeClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700", available: false },
          ].map(({ name, color, desc, badge, badgeClass, available }) => (
            <article
              key={name}
              className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition dark:bg-[#111827] ${available ? "border-slate-200 dark:border-slate-600" : "border-slate-200 opacity-70 dark:border-slate-700"}`}
            >
              <div className="h-1 w-full" style={{ backgroundColor: color }} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[#1e3a5f] dark:text-white">{name}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass}`}>
                    {!available && <Lock size={9} className="mr-0.5 inline-block align-middle" />}
                    {badge}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{desc}</p>
                {available && (
                  <Link href="/auth/signup" className="mt-4 block rounded-lg bg-[var(--accent-color)] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a]">
                    Start free trial
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="reveal-item mx-auto max-w-7xl px-4 py-14 md:px-6" data-reveal>
        <h2 className="text-center text-3xl font-bold text-[#1e3a5f] dark:text-white">Built for your industry</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-[#475569] dark:text-slate-300">
          Choose your sector to jump to tailored workflows — new accounts default to trades, and you can pick multiple
          industries when you sign up.
        </p>
        <div className="mt-10">
          <LandingIndustryTiles />
        </div>
      </section>

      <LandingIndustryDeepSections />

      <section
        className="border-y border-slate-200 bg-white py-4 dark:border-slate-700 dark:bg-[#152238]/80"
        aria-label="About"
      >
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">
            Built in Adelaide SA · ABN 88 688 301 684 · By a tradie, for tradies.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">
          Still running your business on paper and WhatsApp?
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {painPoints.map(({ Icon, title, copy }) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#0f1929]"
            >
              <Icon className={`h-9 w-9 ${tealIcon}`} strokeWidth={1.75} aria-hidden />
              <h3 className="mt-3 text-lg font-semibold text-[#1e3a5f] dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">
          Everything your business needs, nothing it doesn&apos;t
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, description }) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]"
            >
              <Icon className={`h-9 w-9 ${tealIcon}`} strokeWidth={1.75} aria-hidden />
              <h3 className="mt-3 text-lg font-semibold text-[#1e3a5f] dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <PricingWithEnterprise />
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">Built in Australia for service operators</h2>
        <p className="mt-4 max-w-3xl text-[#475569] dark:text-slate-300">
          SERVLO began with trades teams on tools and grew into the workspace Australian cleaners, field crews, events teams,
          agencies and clinics reach for daily. Every workflow stays fast on mobile, sharp on desktop and honest about cash
          flow.
        </p>
      </section>

      {/* ── Full platform section ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-color)] dark:text-cyan-400">
            The complete SERVLO platform
          </span>
        </div>
        <h2 className="text-center text-3xl font-bold text-[#1e3a5f] dark:text-white">
          Built for Australian service businesses
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-[#475569] dark:text-slate-300">
          Start with what you need today. Unlock the full platform as it launches.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Active products */}
          {[
            { name: "SERVLO Core",  color: "#3B82F6", desc: "Job management, invoicing, scheduling and clients", badge: "Available now", available: true  },
            { name: "SERVLO Grow",  color: "#8B5CF6", desc: "AI ads, review automation and social content",      badge: "Coming Q3 2026", available: false },
            { name: "SERVLO Leads", color: "#F59E0B", desc: "Verified job leads marketplace",                    badge: "Coming Q4 2026", available: false },
            { name: "SERVLO Answer",   color: "#14B8A6", desc: "AI phone agent — answers calls and books jobs",   badge: "Q3 2026" , available: false },
            { name: "SERVLO Pay",      color: "#22C55E", desc: "Integrated payment processing for every job",    badge: "Q4 2026",  available: false },
            { name: "SERVLO Hire",     color: "#F97316", desc: "Find tradies or find work — the trade job board",badge: "Q1 2027",  available: false },
            { name: "SERVLO Fleet",    color: "#0EA5E9", desc: "GPS tracking for vehicles and equipment",        badge: "Q2 2027",  available: false },
            { name: "SERVLO Finance",  color: "#6366F1", desc: "Business loans and invoice financing",            badge: "Q3 2027",  available: false },
            { name: "SERVLO Insurance",color: "#F43F5E", desc: "Embedded tradie insurance, quoted instantly",    badge: "Q4 2027",  available: false },
            { name: "SERVLO Safe",     color: "#EF4444", desc: "Safety compliance, incidents and toolbox talks", badge: "Q2 2027",  available: false },
            { name: "SERVLO Books",    color: "#10B981", desc: "Bookkeeping, BAS lodgement and expenses",        badge: "Q3 2027",  available: false },
            { name: "SERVLO Academy",  color: "#EAB308", desc: "Trade training, compliance and licences",        badge: "Q1 2028",  available: false },
          ].map(({ name, color, desc, badge, available }) =>
            available ? (
              <article key={name} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111827]">
                <div className="h-1 w-full" style={{ backgroundColor: color }} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#1e3a5f] dark:text-white">{name}</h3>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
                      {badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{desc}</p>
                </div>
              </article>
            ) : (
              <a
                key={name}
                href={`mailto:hello@servlo.com.au?subject=SERVLO ${encodeURIComponent(name.replace("SERVLO ", ""))} Early Access`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white opacity-65 shadow-sm transition hover:opacity-85 dark:border-slate-700 dark:bg-[#111827]"
                title={`Register interest in ${name}`}
              >
                <div className="h-1 w-full" style={{ backgroundColor: color }} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#1e3a5f] dark:text-white">{name}</h3>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                      <Lock size={9} />
                      {badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{desc}</p>
                  <p className="mt-2 text-xs font-semibold text-[var(--accent-color)] opacity-0 transition group-hover:opacity-100 dark:text-cyan-400">
                    Register interest →
                  </p>
                </div>
              </a>
            )
          )}
        </div>
        <p className="mt-8 text-center text-sm text-[#475569] dark:text-slate-400">
          All 12 products included in one login &nbsp;·&nbsp; Add products as your business grows &nbsp;·&nbsp; Cancel anytime
        </p>
      </section>

      <section className="bg-[#1e3a5f] px-4 py-16 dark:bg-[#0b1628]" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-heading" className="text-3xl font-bold text-white md:text-4xl">
            Ready to run your business smarter?
          </h2>
          <p className="mt-4 text-lg text-cyan-100/95 md:text-xl">
            Start your 30-day free trial today.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex min-w-[220px] items-center justify-center rounded-xl bg-[var(--accent-color)] px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a] dark:hover:bg-cyan-300"
          >
            Start Free Trial
          </Link>
          <p className="mx-auto mt-5 max-w-lg text-sm text-cyan-100/80">
            Tell us your industry on signup and we&apos;ll personalise your dashboard.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-[#0b1220]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="SERVLO" width={28} height={28} />
              <p className="font-bold text-[#1e3a5f] dark:text-white">SERVLO</p>
            </div>
            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
              The operating system for Australian service businesses
            </p>
            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
              Questions? We&apos;re based in Adelaide, South Australia. Email us at hello@servlo.com.au
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#475569] md:justify-end dark:text-slate-300">
            <Link href="/privacy" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              Contact
            </Link>
            <Link href="/status" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              System Status
            </Link>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-[#64748b] dark:text-slate-400">
          © 2026 SERVLO. All rights reserved. ABN: 88 688 301 684
        </p>
      </footer>
    </main>
  );
}
