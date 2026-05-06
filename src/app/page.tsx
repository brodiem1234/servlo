import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  FileText,
  UserCog,
  LayoutDashboard,
  Camera,
  type LucideIcon
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingIndustryTiles } from "@/components/landing-industry-tiles";
import { LANDING_INDUSTRY_ORDER } from "@/lib/industries";
import { LANDING_INDUSTRY_COPY } from "@/lib/industry-marketing";

const tealIcon = "text-[var(--accent-color)] dark:text-cyan-400";

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

const testimonials = [
  {
    name: "Jake T.",
    role: "Electrician, Adelaide SA",
    trade: "Trades",
    quote: "Finally an app that doesn't need a manual. My crew was using it same day."
  },
  {
    name: "Lisa M.",
    role: "Cleaning services, Adelaide SA",
    trade: "Cleaning",
    quote: "NDIS cleans and commercial sites live in one calendar — invoicing actually matches what we did."
  },
  {
    name: "Sam K.",
    role: "Event coordinator, Adelaide SA",
    trade: "Events",
    quote: "Bump-in to bump-out lives in SERVLO now. Crew and hire gear finally match the run sheet."
  }
];

const pricingPlans = [
  {
    name: "Solo",
    price: "$29/mo",
    popular: false,
    list: [
      "1 user",
      "Jobs & scheduling",
      "Clients",
      "Invoices & quotes",
      "PDF generation",
      "Email notifications"
    ]
  },
  {
    name: "Team",
    price: "$79/mo",
    popular: true,
    list: [
      "Up to 5 users",
      "All Solo features",
      "Employee management",
      "GPS clock in/out",
      "Job photos",
      "Priority support"
    ]
  },
  {
    name: "Business",
    price: "$179/mo",
    popular: false,
    list: [
      "Up to 20 users",
      "All Team features",
      "Contractor management",
      "Advanced reporting",
      "API access",
      "Dedicated support"
    ]
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
    <main className="min-h-screen scroll-smooth bg-slate-50 text-[#1e3a5f] [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif] dark:bg-[#0f172a] dark:text-white">
      <LandingHeader />

      <section className="bg-[#f1f5f9] dark:bg-[#1e3a5f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-[#1e3a5f] dark:text-white md:text-6xl">
              Run Your Service Business From Your Phone
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[#475569] dark:text-cyan-100">
              Jobs, clients, invoices, quotes and scheduling — built for Australian service businesses.
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

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1e3a5f] dark:text-white">Built for your industry</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-[#475569] dark:text-slate-300">
          Choose your sector to jump to tailored workflows — new accounts default to trades, and you can pick multiple
          industries when you sign up.
        </p>
        <div className="mt-10">
          <LandingIndustryTiles />
        </div>
      </section>

      {LANDING_INDUSTRY_ORDER.map((slug) => {
        const copy = LANDING_INDUSTRY_COPY[slug];
        return (
          <section
            key={slug}
            id={`industry-${slug}`}
            className="scroll-mt-28 border-t border-slate-200 bg-white py-14 dark:border-slate-700 dark:bg-[#111827]/40"
          >
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] dark:text-cyan-400">
                {copy.headline}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#1e3a5f] dark:text-white md:text-3xl">{copy.tagline}</h3>
              <ul className="mt-6 max-w-3xl space-y-3 text-[#475569] dark:text-slate-300">
                {copy.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-sm leading-relaxed md:text-base">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-color)] dark:bg-cyan-400" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section
        className="border-y border-slate-200 bg-white py-3 dark:border-slate-700 dark:bg-[#152238]/80"
        aria-label="Social proof"
      >
        <div className="mx-auto max-w-5xl px-4 text-center text-xs font-medium leading-relaxed text-[#475569] dark:text-slate-300 sm:text-sm">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="text-[#1e3a5f] dark:text-white">500+ jobs managed</span>
            <span className="hidden text-slate-300 sm:inline dark:text-slate-600" aria-hidden>
              ·
            </span>
            <span className="text-[#1e3a5f] dark:text-white">$2M+ invoiced</span>
            <span className="hidden text-slate-300 sm:inline dark:text-slate-600" aria-hidden>
              ·
            </span>
            <span className="text-[#1e3a5f] dark:text-white">Built in Adelaide SA</span>
            <span className="hidden text-slate-300 sm:inline dark:text-slate-600" aria-hidden>
              ·
            </span>
            <span className="text-[#1e3a5f] dark:text-white">30-day free trial</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">
          Still running your business on paper and WhatsApp?
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["📋", "Chasing unpaid invoices at midnight", "Cashflow suffers when follow-ups fall behind."],
            ["📱", "Texting job details to employees one by one", "Manual updates waste time and create mistakes."],
            ["🗂️", "Losing quotes in your email inbox", "Missed follow-up means missed revenue."]
          ].map(([icon, title, copy]) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]"
            >
              <p className="text-2xl">{icon}</p>
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
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">Simple pricing, no surprises</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-xl border p-6 ${
                plan.popular
                  ? "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_10%,#ffffff)] shadow-md shadow-[color-mix(in_srgb,var(--accent-color)_18%,transparent)] dark:border-cyan-400 dark:bg-[#10283a]"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">{plan.name}</h3>
                {plan.popular ? (
                  <span className="shrink-0 rounded-full bg-[var(--accent-color)] px-2 py-1 text-xs font-semibold text-white dark:bg-cyan-400 dark:text-[#0f172a]">
                    Most Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#1e3a5f] dark:text-white">{plan.price}</p>
              <ul className="mt-4 flex-1 space-y-2.5 text-sm text-[#334155] dark:text-slate-200">
                {plan.list.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-[var(--accent-color)] dark:text-cyan-400" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="mt-6 inline-block rounded-md bg-[var(--accent-color)] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a] dark:hover:bg-cyan-300"
              >
                Start Free Trial
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#64748b] dark:text-slate-300">
          All plans include a 30-day free trial. No credit card required.
        </p>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">Built in Australia for service operators</h2>
        <p className="mt-4 max-w-3xl text-[#475569] dark:text-slate-300">
          SERVLO began with trades teams on tools and grew into the workspace Australian cleaners, field crews, events teams,
          agencies and clinics reach for daily. Every workflow stays fast on mobile, sharp on desktop and honest about cash
          flow.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-color)] dark:text-cyan-400">{t.trade}</p>
              <p className="mt-2 text-amber-500 dark:text-amber-300">★★★★★</p>
              <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-slate-200">&quot;{t.quote}&quot;</p>
              <p className="mt-3 text-xs font-semibold text-[#1e3a5f] dark:text-white">
                {t.name}
                <span className="mt-0.5 block font-normal text-[#64748b] dark:text-slate-400">{t.role}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#1e3a5f] px-4 py-16 dark:bg-[#0b1628]" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-heading" className="text-3xl font-bold text-white md:text-4xl">
            Ready to run your business smarter?
          </h2>
          <p className="mt-4 text-lg text-cyan-100/95 md:text-xl">
            Join Australian service businesses already using SERVLO.
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
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-[#64748b] dark:text-slate-400">
          © 2026 SERVLO. All rights reserved. ABN: 88 688 301 684
        </p>
      </footer>
    </main>
  );
}
