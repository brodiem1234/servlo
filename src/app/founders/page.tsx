import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founding Members | SERVLO",
  description: "The first 50 businesses to join SERVLO: locked-in pricing for life, early access, and a direct line to the team.",
};

const FOUNDING_LIMIT = 50;

export default async function FoundersPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_founding_member", true);

  const founderCount = count ?? 0;
  const remaining = Math.max(0, FOUNDING_LIMIT - founderCount);
  const pct = Math.min(100, Math.round((founderCount / FOUNDING_LIMIT) * 100));

  const benefits = [
    { title: "Locked-in pricing for life", desc: "Your plan rate never increases. Solo at $29/mo, Team at $79/mo, Business at $149/mo — whatever you sign up at, that's what you pay forever." },
    { title: "Priority roadmap input", desc: "Your feature requests go to the top of the list. We're building SERVLO with you, not at you." },
    { title: "Early access to everything", desc: "First to try every new feature (GROW, Leads, Fleet, Hire, etc) before public launch." },
    { title: "Permanent recognition", desc: "Your business listed on this page forever as one of the first 50 to back SERVLO." },
    { title: "Direct line to the team", desc: "Email us anytime. We respond personally — no support ticket queues." },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Founding Members</h1>
        <p className="mt-3 text-lg text-neutral-300">
          The first {FOUNDING_LIMIT} businesses to subscribe to SERVLO. These are the early
          believers who help us shape the product.
        </p>

        {/* Counter */}
        <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.04] p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Spots claimed
            </span>
            <span className="text-2xl font-extrabold text-white">
              {founderCount} <span className="text-neutral-500">/ {FOUNDING_LIMIT}</span>
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-neutral-300">
            {remaining > 0 ? (
              <>
                <strong className="text-white">{remaining} spots remaining.</strong>{" "}
                Once these are taken, the program is closed and prices return to standard.
              </>
            ) : (
              <strong className="text-white">
                The Founding Member program is now closed. Thank you to all {FOUNDING_LIMIT} members.
              </strong>
            )}
          </p>
        </div>

        {/* Benefits */}
        <h2 className="mt-12 text-2xl font-bold text-white">
          What you get as a Founding Member
        </h2>
        <div className="mt-5 space-y-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-white/10 bg-[#111111] p-5"
            >
              <p className="text-base font-bold text-white">{b.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {remaining > 0 ? (
          <div className="mt-12 rounded-2xl border border-white/20 bg-white/[0.04] p-8 text-center">
            <h3 className="text-2xl font-extrabold text-white">
              Become a Founding Member
            </h3>
            <p className="mt-2 text-base text-neutral-300">
              Subscribe and the EARLYACCESS code is auto-applied — your founding rate is
              locked for life.
            </p>
            <Link
              href="/auth/signup?plan=solo&code=EARLYACCESS"
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
            >
              Claim your spot — {remaining} left
            </Link>
            <p className="mt-3 text-xs text-neutral-400">
              30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
        ) : null}

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-neutral-500">
          <p>
            SERVLO — operated by Brodie McDonald, ABN 88 688 301 684.
          </p>
        </footer>
      </main>
    </div>
  );
}
