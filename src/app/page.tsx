import Image from "next/image";
import Link from "next/link";

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
    <main className="min-h-screen bg-[#0f172a] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1e3a5f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="SERVLO" width={36} height={36} />
            <span className="text-lg font-bold tracking-wide">SERVLO</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            <a href="#features" className="hover:text-cyan-300">Features</a>
            <a href="#pricing" className="hover:text-cyan-300">Pricing</a>
            <a href="#about" className="hover:text-cyan-300">About</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="rounded-md border border-cyan-300/40 px-3 py-2 text-sm hover:bg-white/10">
              Sign In
            </Link>
            <Link href="/auth/signup" className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-cyan-300">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#1e3a5f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Run Your Trade Business From Your Phone
            </h1>
            <p className="mt-4 max-w-xl text-lg text-cyan-100">
              Jobs, clients, invoices, quotes and employees — all in one place. Built for Australian tradies.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="rounded-lg bg-cyan-400 px-6 py-3 text-base font-semibold text-[#0f172a] hover:bg-cyan-300">
                Start 30-Day Free Trial
              </Link>
              <a href="#features" className="rounded-lg border border-cyan-300/50 px-6 py-3 text-base font-semibold text-cyan-100 hover:bg-white/10">
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-sm text-cyan-100/90">
              No credit card required • Cancel anytime • Australian owned
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/30 bg-[#0f172a]/60 p-4 shadow-2xl">
            <div className="rounded-xl border border-cyan-300/20 bg-slate-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="grid gap-2 text-sm text-slate-300">
                <div className="rounded bg-slate-800 p-2">Today: 8 Jobs • 3 Invoices Due</div>
                <div className="rounded bg-slate-800 p-2">Crew Assigned: 5 Employees</div>
                <div className="rounded bg-slate-800 p-2">Outstanding: $12,450</div>
                <div className="rounded bg-slate-800 p-2">Revenue This Month: $48,200</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold">Still running your business on paper and WhatsApp?</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["📋", "Chasing unpaid invoices at midnight", "Cashflow suffers when follow-ups fall behind."],
            ["📱", "Texting job details to employees one by one", "Manual updates waste time and create mistakes."],
            ["🗂️", "Losing quotes in your email inbox", "Missed follow-up means missed revenue."]
          ].map(([icon, title, copy]) => (
            <article key={title} className="rounded-xl border border-slate-700 bg-[#111827] p-5">
              <p className="text-2xl">{icon}</p>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold">Everything a tradie needs, nothing they don&apos;t</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-slate-700 bg-[#111827] p-5">
              <p className="text-2xl">{feature.emoji}</p>
              <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold">Simple pricing, no surprises</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { name: "Solo", price: "$29/mo", list: ["1 user", "All core features"], popular: false },
            { name: "Team", price: "$79/mo", list: ["Up to 5 employees", "All Solo features"], popular: true },
            { name: "Business", price: "$179/mo", list: ["Up to 20 employees", "All features"], popular: false }
          ].map((plan) => (
            <article key={plan.name} className={`rounded-xl border p-6 ${plan.popular ? "border-cyan-400 bg-[#10283a]" : "border-slate-700 bg-[#111827]"}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                {plan.popular ? <span className="rounded-full bg-cyan-400 px-2 py-1 text-xs font-semibold text-[#0f172a]">Most Popular</span> : null}
              </div>
              <p className="mt-2 text-3xl font-extrabold">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {plan.list.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
              <Link href="/auth/signup" className="mt-6 inline-block rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#0f172a] hover:bg-cyan-300">
                Start Free Trial
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-300">All plans include a 30-day free trial. No credit card required.</p>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="text-3xl font-bold">Built by a tradie, for tradies</h2>
        <p className="mt-4 max-w-3xl text-slate-300">
          SERVLO was built in Australia specifically for the trades industry. Every screen is designed to save time on-site, improve cash flow, and keep your team aligned.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <article key={idx} className="rounded-xl border border-slate-700 bg-[#111827] p-5">
              <p className="text-amber-300">★★★★★</p>
              <p className="mt-3 text-sm text-slate-200">
                &quot;SERVLO has simplified how we run jobs and chase invoices. It&apos;s become part of our daily workflow.&quot;
              </p>
              <p className="mt-3 text-xs text-slate-400">Tradie testimonial placeholder</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-700 bg-[#0b1220]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="SERVLO" width={28} height={28} />
              <p className="font-bold">SERVLO</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">The operating system for Australian trade businesses</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 md:justify-end">
            <a href="#" className="hover:text-cyan-300">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-300">Terms of Service</a>
            <a href="#" className="hover:text-cyan-300">Contact</a>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-slate-400">© 2026 SERVLO. All rights reserved. ABN: [ABN]</p>
      </footer>
    </main>
  );
}


