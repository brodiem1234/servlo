import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#050914] text-white [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <header className="border-b border-white/[0.06] bg-[#050914]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/">
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={100} height={28} unoptimized
              className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)]" />
          </Link>
          <Link href="/auth/signup" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100">
            Start free trial
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-20 md:px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Comparisons</p>
          <h1 className="text-4xl font-extrabold text-white">How SERVLO stacks up</h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-400">
            We publish honest comparisons. Where competitors win, we say so.
            Where we win, we show the numbers.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              href: "/compare/servicem8",
              title: "SERVLO vs ServiceM8",
              desc: "SERVLO wins on price at 51+ jobs/month. ServiceM8 wins on integrations and app maturity.",
              badge: "Most searched",
              badgeStyle: "bg-white/10 text-neutral-300"
            },
            {
              href: "/compare/tradify",
              title: "SERVLO vs Tradify",
              desc: "SERVLO Team ($79) includes unlimited users. Tradify charges per seat.",
              badge: null,
              badgeStyle: ""
            },
          ].map(({ href, title, desc, badge, badgeStyle }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              {badge && (
                <span className={`mb-3 self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeStyle}`}>
                  {badge}
                </span>
              )}
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{desc}</p>
              <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-white transition group-hover:gap-2">
                See comparison <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <h2 className="text-xl font-bold text-white">Don&apos;t see your current tool?</h2>
          <p className="mt-2 text-sm text-slate-400">
            Email us at <a href="mailto:hello@servlo.com.au" className="text-neutral-400 hover:text-white transition">hello@servlo.com.au</a> and
            we&apos;ll help you understand if SERVLO is the right move for your business.
          </p>
        </div>
      </main>
    </div>
  );
}
