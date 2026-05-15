import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ArrowRight, Shield } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "SERVLO 30-Day Money-Back Guarantee",
  description: "Not happy in the first 30 days? We'll refund every cent. No questions, no hassle. That's the SERVLO guarantee.",
};

const guaranteePoints = [
  {
    title: "30-day full refund",
    desc: "If you sign up, pay, and decide SERVLO is not right for you within 30 days, email us and we will refund every cent. No questions asked.",
  },
  {
    title: "No lock-in contract",
    desc: "Cancel any time from Settings then Billing in one click. No notice period. No cancellation fee. No phone call required.",
  },
  {
    title: "Your data, always yours",
    desc: "Export a full ZIP of all your data including clients, jobs, invoices, and quotes, whenever you want. Even if you cancel.",
  },
  {
    title: "We answer within 24 hours",
    desc: "Email hello@servlo.com.au and a real human will respond within one business day.",
  },
];

export default function GuaranteePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="mb-14 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
            <Shield size={28} className="text-gray-700 dark:text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            The SERVLO Guarantee
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            We are confident you will love SERVLO. If you do not, we will make it right.
          </p>
        </div>

        {/* Main guarantee card */}
        <div className="mb-12 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-8 text-center">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-slate-300 max-w-md mx-auto">
            Try SERVLO for 30 days. If you are not completely satisfied, email{" "}
            <a href="mailto:hello@servlo.com.au" className="font-semibold text-gray-900 dark:text-white underline">
              hello@servlo.com.au
            </a>{" "}
            and receive a full refund. No questions. No hassle.
          </p>
        </div>

        {/* Guarantee points */}
        <div className="space-y-4 mb-12">
          {guaranteePoints.map((p) => (
            <div
              key={p.title}
              className="flex gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 transition hover:border-gray-300 dark:hover:border-white/20"
            >
              <CheckCircle size={20} className="mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Founder note */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-6 mb-10">
          <p className="text-sm text-gray-600 dark:text-slate-300 italic leading-relaxed">
            &ldquo;I built SERVLO because I wanted trade businesses to have software that actually works for them, not the other way around.
            If you try SERVLO and it is not the right fit, I would rather you tell me why and get your money back than feel stuck.
            I believe the product speaks for itself.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white flex items-center justify-center text-gray-800 dark:text-black font-bold text-sm">
              B
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Brodie McDonald</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">Founder, SERVLO. Adelaide, South Australia</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-black transition hover:bg-neutral-100"
          >
            Sign Up
            <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-sm text-gray-400 dark:text-slate-500">
            From $29/mo with a 30-day money-back guarantee. Cancel any time.
          </p>
        </div>

        <p className="mt-12 text-center text-sm text-gray-400 dark:text-slate-500">
          Questions?{" "}
          <a href="mailto:hello@servlo.com.au" className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition underline">
            Email hello@servlo.com.au
          </a>
        </p>
      </main>

      <footer className="border-t border-gray-200 dark:border-white/[0.06] py-8 text-center text-xs text-gray-400 dark:text-slate-500">
        <div className="mx-auto max-w-4xl px-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Link href="/">
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={80} height={22} unoptimized
              className="opacity-60 h-5 w-auto hidden dark:block" />
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={80} height={22} unoptimized
              className="opacity-60 h-5 w-auto block dark:hidden" />
          </Link>
          <p>&copy; 2026 SERVLO Pty Ltd &nbsp;&middot;&nbsp; ABN: 88 688 301 684</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
