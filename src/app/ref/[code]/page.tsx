import { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const admin = createAdminClient();
  const { data: referral } = await admin
    .from("grow_referrals")
    .select("owner_id")
    .eq("referral_code", code)
    .maybeSingle();

  let businessName = "SERVLO";
  if (referral?.owner_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("business_name")
      .eq("owner_id", referral.owner_id)
      .maybeSingle();
    if (biz?.business_name) businessName = biz.business_name;
  }

  return {
    title: `${businessName} referred you to SERVLO`,
    description:
      "Business management software for Australian service businesses. Manage jobs, quotes, invoices and your team: all in one place.",
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;
  const admin = createAdminClient();

  // Look up referral
  const { data: referral } = await admin
    .from("grow_referrals")
    .select("id, owner_id, referred_name, status, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  let businessName: string | null = null;
  if (referral?.owner_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("business_name")
      .eq("owner_id", referral.owner_id)
      .maybeSingle();
    businessName = biz?.business_name ?? null;
  }

  const referrerLabel = businessName ?? "A fellow service business";

  // Build signup URL with referral tracking
  const signupUrl = `/auth/signup?ref=${encodeURIComponent(code)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col items-center justify-center px-4 py-16">
      {/* Card */}
      <div className="w-full max-w-lg bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-white tracking-tight">
            SERVLO
          </span>
        </div>

        {/* Referral badge */}
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-violet-500/20 border border-violet-400/30 px-4 py-1.5 text-sm font-medium text-violet-300">
            Referred by {referrerLabel}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-3">
          Run your service business smarter
        </h1>
        <p className="text-slate-300 text-center text-sm mb-8 leading-relaxed">
          SERVLO is the all-in-one platform built for Australian tradies and
          service businesses. Jobs, quotes, invoices, clients and your team,
          managed in one place.
        </p>

        {/* Feature bullets */}
        <ul className="space-y-3 mb-8">
          {[
            "Send professional quotes & invoices in minutes",
            "Schedule jobs and manage your whole team",
            "Get paid faster with online payment links",
            "Automate follow-ups, reminders & status updates",
            "No lock-in. Cancel any time",
          ].map((feat) => (
            <li key={feat} className="flex items-start gap-3 text-sm text-slate-200">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-violet-500/30 border border-violet-400/40 flex items-center justify-center text-violet-300 text-xs">
                ✓
              </span>
              {feat}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={signupUrl}
          className="block w-full text-center rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-white font-semibold py-3.5 text-base shadow-lg shadow-violet-900/40"
        >
          Start my 30-day free trial →
        </Link>
        <p className="mt-3 text-center text-xs text-slate-500">
          No credit card required · Cancel any time
        </p>
      </div>

      {/* Tagline */}
      <p className="mt-10 text-slate-600 text-xs text-center">
        Built for Australian service businesses by Australians.
      </p>
    </div>
  );
}
