import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHeader } from "@/components/landing-header";

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <LandingHeader />

      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24 md:px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Comparisons</p>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">How SERVLO stacks up</h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-500 dark:text-slate-400">
            We publish honest comparisons. Where competitors win, we say so.
            Where we win, we show the numbers.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              href: "/compare/servicem8",
              title: "SERVLO vs ServiceM8",
              desc: "SERVLO wins on price at 50+ jobs/month and adds AI tools ServiceM8 doesn't offer. ServiceM8 wins on app maturity.",
              badge: "Most searched",
            },
            {
              href: "/compare/tradify",
              title: "SERVLO vs Tradify",
              desc: "SERVLO Team ($79) includes unlimited users. Tradify charges per seat and lacks AI features.",
              badge: null,
            },
          ].map(({ href, title, desc, badge }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 transition hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            >
              {badge && (
                <span className="mb-3 self-start rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-neutral-300">
                  {badge}
                </span>
              )}
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{desc}</p>
              <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white transition group-hover:gap-2">
                See comparison <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Don&apos;t see your current tool?</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Email us at{" "}
            <a href="mailto:hello@servlo.com.au" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition underline">
              hello@servlo.com.au
            </a>{" "}
            and we&apos;ll help you understand if SERVLO is the right move for your business.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-white/[0.06] py-8 text-center text-xs text-gray-400 dark:text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Link href="/">
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={80} height={22} unoptimized
              className="opacity-60 h-5 w-auto hidden dark:block" />
            <Image src="/servlo-master-dark.svg" alt="SERVLO" width={80} height={22} unoptimized
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
