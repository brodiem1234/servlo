import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

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
    desc: "Cancel any time from Settings, then Billing, in one click. No notice period. No cancellation fee. No phone call required.",
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
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <Image
              src="/servlo-master-white.svg"
              alt="SERVLO"
              width={120}
              height={32}
              unoptimized
              className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-8 w-auto"
            />
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="mb-14 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/servlo-master-white.svg"
              alt="SERVLO"
              width={140}
              height={40}
              unoptimized
              className="drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] h-12 w-auto"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            The SERVLO Guarantee
          </h1>
          <p className="mt-4 text-lg text-neutral-400 max-w-xl mx-auto">
            We are confident you will love SERVLO. If you do not, we will make it right.
          </p>
        </div>

        {/* Main guarantee card */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center">
          <h2 className="text-2xl font-black text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="mt-3 text-base text-neutral-300 max-w-md mx-auto">
            Try SERVLO for 30 days. If you are not completely satisfied, email{" "}
            <a href="mailto:hello@servlo.com.au" className="font-semibold text-white underline">
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
              className="flex gap-4 rounded-xl border border-white/10 bg-neutral-950 p-5"
            >
              <CheckCircle size={20} className="mt-0.5 shrink-0 text-white" />
              <div>
                <h3 className="font-bold text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-neutral-400">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Founder note */}
        <div className="rounded-xl border border-white/10 bg-neutral-950 p-6 mb-10">
          <p className="text-sm text-neutral-300 italic leading-relaxed">
            &ldquo;I built SERVLO because I wanted trade businesses to have software that actually works for them, not the other way around.
            If you try SERVLO and it is not the right fit, I would rather you tell me why and get your money back than feel stuck.
            I believe the product speaks for itself.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-sm">
              B
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Brodie McDonald</p>
              <p className="text-xs text-neutral-500">Founder, SERVLO. Adelaide, South Australia</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-black transition hover:bg-neutral-200"
          >
            Start free trial. 30 days free
            <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-sm text-neutral-500">
            No credit card required to start. Cancel any time.
          </p>
        </div>

        <p className="mt-12 text-center text-sm text-neutral-500">
          Questions?{" "}
          <a href="mailto:hello@servlo.com.au" className="text-neutral-400 hover:text-white transition underline">
            Email hello@servlo.com.au
          </a>
        </p>
      </main>
    </div>
  );
}
