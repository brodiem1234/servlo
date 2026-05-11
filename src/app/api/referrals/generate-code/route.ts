import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/referrals/generate-code
 * Generates a unique referral code for the authenticated business owner.
 * If one exists, returns the existing code.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Check if a referral code already exists
  const { data: existing } = await admin
    .from("businesses")
    .select("referral_code")
    .eq("owner_id", user.id)
    .single();

  if (existing?.referral_code) {
    return NextResponse.json({ code: existing.referral_code });
  }

  // Generate a unique 8-character code
  function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  let code = generateCode();
  let attempts = 0;

  // Ensure uniqueness
  while (attempts < 10) {
    const { data: conflict } = await admin
      .from("businesses")
      .select("id")
      .eq("referral_code", code)
      .single();

    if (!conflict) break;
    code = generateCode();
    attempts++;
  }

  const { error } = await admin
    .from("businesses")
    .update({ referral_code: code })
    .eq("owner_id", user.id);

  if (error) {
    console.error("[referrals/generate-code] update failed:", error);
    return NextResponse.json({ error: "Failed to save referral code" }, { status: 500 });
  }

  return NextResponse.json({ code });
}

/**
 * GET /api/referrals/generate-code
 * Returns the current referral code (generates one if missing).
 */
export async function GET() {
  return POST();
}
