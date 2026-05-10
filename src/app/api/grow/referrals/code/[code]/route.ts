import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/grow/referrals/code/[code]
 * Public endpoint — looks up a grow_referral by referral_code.
 * Returns the business name so the landing page can personalise.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code || code.length < 2) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up the referral row
  const { data: referral, error } = await admin
    .from("grow_referrals")
    .select("id, owner_id, referred_name, status, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ referral: null });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!referral) {
    return NextResponse.json({ referral: null });
  }

  // Fetch the referring business name
  const { data: business } = await admin
    .from("businesses")
    .select("business_name")
    .eq("owner_id", referral.owner_id)
    .maybeSingle();

  return NextResponse.json({
    referral: {
      id: referral.id,
      referralCode: referral.referral_code,
      referredName: referral.referred_name,
      status: referral.status,
      businessName: business?.business_name ?? null,
    },
  });
}
