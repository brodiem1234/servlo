import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/founding-100/count
 * Returns count of founding members from businesses table.
 * Public endpoint — no auth required.
 */
const FOUNDING_LIMIT = 50;

export async function GET(_req: NextRequest) {
  try {
    const admin = createAdminClient();

    // Try businesses.is_founding_member first, fall back to profiles
    const { count: bizCount } = await admin
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("is_founding_member", true);

    const founderCount = bizCount ?? 0;
    const remaining = Math.max(0, FOUNDING_LIMIT - founderCount);

    return NextResponse.json(
      { count: founderCount, remaining, isFull: founderCount >= FOUNDING_LIMIT, limit: FOUNDING_LIMIT },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[founding-100/count] error:", err);
    return NextResponse.json(
      { count: 0, remaining: FOUNDING_LIMIT, isFull: false, limit: FOUNDING_LIMIT },
      { status: 200 }
    );
  }
}
