import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-900">
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <header className="mb-16 flex items-center justify-between">
          <p className="text-2xl font-bold tracking-wide text-sky-950">SERVLO</p>
          <div className="flex gap-3">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-sky-700 hover:bg-sky-800">
              <Link href="/auth/signup">Start free trial</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-900">
              Built for Australian trades
            </p>
            <h1 className="text-4xl font-bold leading-tight text-sky-950 sm:text-5xl">
              Manage jobs, teams, and payments from one modern platform.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              SERVLO helps trade businesses streamline scheduling, timesheets, invoicing, and
              team operations so you can scale with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-sky-700 hover:bg-sky-800">
                <Link href="/auth/signup">Start 30 day free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-sky-300 text-sky-900">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-sky-950">Why SERVLO</h2>
            <ul className="mt-4 space-y-3 text-slate-700">
              <li>- Smart scheduling for field teams and contractors</li>
              <li>- Job tracking from quote to completion</li>
              <li>- Digital timesheets and payroll-ready exports</li>
              <li>- Subscription billing and business performance insights</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-bold text-sky-950">Features that keep your crew moving</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-sky-100 bg-white p-6">
            <h3 className="font-semibold text-sky-900">Job Management</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track every job status in real time with owner and employee dashboards.
            </p>
          </article>
          <article className="rounded-xl border border-sky-100 bg-white p-6">
            <h3 className="font-semibold text-sky-900">Team Coordination</h3>
            <p className="mt-2 text-sm text-slate-600">
              Assign work, monitor field progress, and keep communication in one place.
            </p>
          </article>
          <article className="rounded-xl border border-sky-100 bg-white p-6">
            <h3 className="font-semibold text-sky-900">Billing & Growth</h3>
            <p className="mt-2 text-sm text-slate-600">
              Handle subscriptions and improve profitability with clear business metrics.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-3xl font-bold text-sky-950">Simple pricing for every stage</h2>
        <p className="mt-3 text-slate-600">All plans include a 30 day free trial.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { name: "Solo", price: "$29/mo", description: "For individual operators." },
            { name: "Team", price: "$79/mo", description: "For growing trade teams." },
            { name: "Business", price: "$179/mo", description: "For established businesses." }
          ].map((plan) => (
            <article
              key={plan.name}
              className="flex flex-col rounded-xl border border-sky-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-sky-900">{plan.name}</h3>
              <p className="mt-3 text-3xl font-bold text-sky-950">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <Button asChild className="mt-6 w-full bg-sky-700 hover:bg-sky-800">
                <Link href="/auth/signup">Start free trial</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

