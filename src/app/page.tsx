import Image from "next/image";
import Link from "next/link";
import { ThemeTogglePublic } from "@/components/theme-toggle-public";

const features = [
  {
    emoji: "🔧",
    title: "Jobs & Scheduling",
    description: "Calendar view, assign employees, track status"
  },
  {
    emoji: "👥",
    title: "Client Management",
    description: "Full history, portal, auto follow-ups"
  },
  {
    emoji: "🧾",
    title: "Invoices & Quotes",
    description: "Professional PDFs, send via email, get paid faster"
  },
  {
    emoji: "👷",
    title: "Employee Management",
    description: "Clock in/out, timesheets, job assignments"
  },
  {
    emoji: "📊",
    title: "Business Dashboard",
    description: "Revenue, profit margins, outstanding invoices"
  },
  {
    emoji: "📸",
    title: "Job Photos",
    description: "Before/after photos attached to every job"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen scroll-smooth bg-slate-50 text-[#1e3a5f] [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif] dark:bg-[#0f172a] dark:text-white">
      <header className="sticky top-0 z-50 border-b border-t-2 border-teal-400 border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#1e3a5f]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="SERVLO" width={36} height={36} />
            <span className="text-lg font-bold tracking-wide text-[#1e3a5f] dark:text-white">SERVLO</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#334155] dark:text-slate-200 md:flex">
            <a href="#features" className="hover:text-[#0db8c8] dark:hover:text-cyan-300">
              Features
            </a>
            <a href="#pricing" className="hover:text-[#0db8c8] dark:hover:text-cyan-300">
              Pricing
            </a>
            <a href="#about" className="hover:text-[#0db8c8] dark:hover:text-cyan-300">
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeTogglePublic />
            <Link
              href="/auth/login"
              className="rounded-md border border-[#0db8c8]/45 px-3 py-2 text-sm text-[#1e3a5f] hover:bg-slate-100 dark:border-cyan-300/40 dark:text-white dark:hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-[#0db8c8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0a9dab] dark:text-[#0f172a] dark:bg-cyan-400 dark:hover:bg-cyan-300"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#f1f5f9] dark:bg-[#1e3a5f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-[#1e3a5f] dark:text-white md:text-6xl">
              Run Your Trade Business From Your Phone
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[#475569] dark:text-cyan-100">
              Jobs, clients, invoices, quotes and employees — all in one place. Built for Australian tradies.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/signup"
                className="rounded-lg bg-[#0db8c8] px-6 py-3 text-base font-semibold text-white hover:bg-[#0a9dab] dark:text-[#0f172a] dark:bg-cyan-400 dark:hover:bg-cyan-300"
              >
                Start 30-Day Free Trial
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-[#0db8c8]/50 px-6 py-3 text-base font-semibold text-[#1e3a5f] hover:bg-white dark:border-cyan-300/50 dark:text-cyan-100 dark:hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-sm text-[#64748b] dark:text-cyan-100/90">
              No credit card required • Cancel anytime • Australian owned
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-cyan-300/30 dark:bg-[#0f172a]/60 dark:shadow-2xl">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-cyan-300/20 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="grid gap-2 text-sm text-[#475569] dark:text-slate-300">
                <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">Today: 8 Jobs • 3 Invoices Due</div>
                <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">Crew Assigned: 5 Employees</div>
                <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">Outstanding: $12,450</div>
                <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">Revenue This Month: $48,200</div>
              </div>
            </div>
          </div>
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
          Everything a tradie needs, nothing they don&apos;t
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]"
            >
              <p className="text-2xl">{feature.emoji}</p>
              <h3 className="mt-3 text-lg font-semibold text-[#1e3a5f] dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">Simple pricing, no surprises</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { name: "Solo", price: "$29/mo", list: ["1 user", "All core features"], popular: false },
            { name: "Team", price: "$79/mo", list: ["Up to 5 employees", "All Solo features"], popular: true },
            { name: "Business", price: "$179/mo", list: ["Up to 20 employees", "All features"], popular: false }
          ].map((plan) => (
            <article
              key={plan.name}
              className={`rounded-xl border p-6 ${
                plan.popular
                  ? "border-[#0db8c8] bg-[#e6f9fb] dark:border-cyan-400 dark:bg-[#10283a]"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">{plan.name}</h3>
                {plan.popular ? (
                  <span className="rounded-full bg-[#0db8c8] px-2 py-1 text-xs font-semibold text-white dark:bg-cyan-400 dark:text-[#0f172a]">
                    Most Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#1e3a5f] dark:text-white">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#334155] dark:text-slate-200">
                {plan.list.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="mt-6 inline-block rounded-md bg-[#0db8c8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a9dab] dark:bg-cyan-400 dark:text-[#0f172a] dark:hover:bg-cyan-300"
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
        <h2 className="text-3xl font-bold text-[#1e3a5f] dark:text-white">Built by a tradie, for tradies</h2>
        <p className="mt-4 max-w-3xl text-[#475569] dark:text-slate-300">
          SERVLO was built in Australia specifically for the trades industry. Every screen is designed to save time on-site,
          improve cash flow, and keep your team aligned.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Jake T. — Electrician, Adelaide SA",
            "Mick S. — Plumber, Adelaide SA",
            "Dave R. — Builder, Adelaide SA"
          ].map((name) => (
            <article
              key={name}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]"
            >
              <p className="text-amber-500 dark:text-amber-300">★★★★★</p>
              <p className="mt-3 text-sm text-[#334155] dark:text-slate-200">
                &quot;SERVLO has simplified how we run jobs and chase invoices. It&apos;s become part of our daily
                workflow.&quot;
              </p>
              <p className="mt-3 text-xs text-[#64748b] dark:text-slate-400">{name}</p>
            </article>
          ))}
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
              The operating system for Australian trade businesses
            </p>
            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
              Questions? We&apos;re based in Adelaide, South Australia. Email us at hello@servlo.com.au
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#475569] md:justify-end dark:text-slate-300">
            <Link href="/privacy" className="hover:text-[#0db8c8] dark:hover:text-cyan-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#0db8c8] dark:hover:text-cyan-300">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-[#0db8c8] dark:hover:text-cyan-300">
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
