import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const PLANS = [
    {
      name: "Solo",
      price: "$29/mo",
      priceId: process.env.STRIPE_SOLO_PRICE_ID ?? "",
      features: ["1 user", "Unlimited clients", "AI (50 uses/mo)", "Jobs, invoices, quotes"],
      accent: "#3B82F6",
    },
    {
      name: "Team",
      price: "$79/mo",
      priceId: process.env.STRIPE_TEAM_PRICE_ID ?? "",
      features: ["Unlimited users", "Unlimited clients", "AI (200 uses/mo)", "SMS automation"],
      accent: "#7c3aed",
      popular: true,
    },
    {
      name: "Business",
      price: "$149/mo",
      priceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? "",
      features: ["Unlimited users", "AI (500 uses/mo)", "BAS prep", "Xero/MYOB", "White-label"],
      accent: "#059669",
    },
  ];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status, trial_end, trial_expired_at")
    .eq("id", user.id)
    .single();

  // If user has an active subscription, redirect to settings
  if (profile?.subscription_status === "active") {
    redirect("/dashboard/owner/settings?tab=billing");
  }

  const isExpired = !!profile?.trial_expired_at;
  const trialEndDate = profile?.trial_end
    ? new Date(profile.trial_end).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard/owner" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          ← Back to dashboard
        </Link>
      </div>

      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-10">
            {isExpired ? (
              <>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-1.5 text-sm font-medium text-red-500">
                  Subscription inactive
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Pick up where you left off</h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Choose a plan to restore access to your jobs, clients, invoices, and all your business data.
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/15 px-4 py-1.5 text-sm font-medium text-white">
                  Choose your plan
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Pick the plan that fits your business</h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  All plans include a 30-day money-back guarantee. Cancel anytime from Settings.
                </p>
              </>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col gap-4 ${
                  plan.popular
                    ? "border-[var(--accent-color)] shadow-lg"
                    : "border-[var(--border)]"
                } bg-[var(--bg-card)]`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-color)] px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wide">
                    Most popular
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h2>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">{plan.price}</p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/api/billing/checkout?plan=${plan.name.toLowerCase()}&priceId=${plan.priceId}`}
                  className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: plan.accent }}
                >
                  Subscribe — {plan.price}
                </a>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Enterprise — from $299/mo</p>
              <p className="text-sm text-[var(--text-secondary)]">Unlimited everything, 2000 AI uses/mo, dedicated support</p>
            </div>
            <a
              href="mailto:hello@servlo.com.au?subject=Enterprise Enquiry"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition whitespace-nowrap"
            >
              Contact us
            </a>
          </div>

          <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
            Cancel anytime. All prices in AUD, inc. GST.
          </p>
        </div>
      </main>
    </div>
  );
}
