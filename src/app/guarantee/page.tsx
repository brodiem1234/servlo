import Link from "next/link";
import { Shield, CheckCircle, ArrowRight, Star } from "lucide-react";

export const metadata = {
  title: "SERVLO 30-Day Money-Back Guarantee",
  description: "Not happy in the first 30 days? We'll refund every cent. No questions, no hassle. That's the SERVLO guarantee.",
};

export default function GuaranteePage() {
  const guaranteePoints = [
    {
      title: "30-day full refund",
      desc: "If you sign up, pay, and decide SERVLO isn't right for you within 30 days — email us and we'll refund every cent. No questions asked.",
    },
    {
      title: "No lock-in contract",
      desc: "Cancel any time from Settings → Billing in one click. No notice period. No cancellation fee. No phone call required.",
    },
    {
      title: "Your data, always",
      desc: "Export a full ZIP of all your data — clients, jobs, invoices, quotes — whenever you want. Even if you cancel.",
    },
    {
      title: "We answer within 24 hours",
      desc: "Email hello@servlo.com.au and a real human (Brodie, the founder) will respond within one business day.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight text-blue-500">
            SERVLO
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Shield size={36} className="text-blue-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            The SERVLO Guarantee
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            We're confident you'll love SERVLO. But if you don't, we'll make it right.
          </p>
        </div>

        {/* Main guarantee box */}
        <div className="mb-12 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-slate-300 max-w-md mx-auto">
            Try SERVLO for 30 days. If you&apos;re not completely satisfied, email{" "}
            <a href="mailto:hello@servlo.com.au" className="font-semibold text-blue-600 dark:text-blue-400 underline">
              hello@servlo.com.au
            </a>{" "}
            and receive a full refund — no questions, no hassle.
          </p>
        </div>

        {/* Guarantee points */}
        <div className="space-y-4 mb-12">
          {guaranteePoints.map(p => (
            <div
              key={p.title}
              className="flex gap-4 rounded-xl border border-gray-200 dark:border-white/10 p-5"
            >
              <CheckCircle size={20} className="mt-0.5 shrink-0 text-blue-500" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Founder note */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-6 mb-10">
          <p className="text-sm text-gray-600 dark:text-slate-300 italic leading-relaxed">
            &ldquo;I built SERVLO because I wanted trade businesses to have software that actually works for them — not the other way around.
            If you try SERVLO and it&apos;s not the right fit, I&apos;d rather you tell me why and get your money back, than feel stuck.
            I believe the product speaks for itself.&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Brodie McDonald</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">Founder, SERVLO — Adelaide, South Australia</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-base font-semibold text-white hover:bg-blue-600 transition"
          >
            Start free trial — 30 days free
            <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-sm text-gray-400 dark:text-slate-500">
            No credit card required to start. Cancel any time.
          </p>
        </div>
      </main>
    </div>
  );
}
