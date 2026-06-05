import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { FOUNDING_MEMBER_LIMIT, getFoundingMemberCount } from "@/lib/founding-members";

/**
 * GET /api/founders/count
 * Returns the current founding member count.
 * Public endpoint — no auth required.
 */
export async function GET(req: NextRequest) {
  // ?preview=N — returns synthetic data for UI testing without auth
  const { searchParams } = new URL(req.url);
  const previewParam = searchParams.get("preview");
  if (previewParam !== null) {
    const n = Math.min(FOUNDING_MEMBER_LIMIT, Math.max(0, parseInt(previewParam, 10) || 0));
    return NextResponse.json(
      { count: n, remaining: FOUNDING_MEMBER_LIMIT - n, isFull: n >= FOUNDING_MEMBER_LIMIT },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimitResponse = await checkRateLimit("foundersCount", "global");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const admin = createAdminClient();
    const founderCount = await getFoundingMemberCount(admin);
    const remaining = Math.max(0, FOUNDING_MEMBER_LIMIT - founderCount);

    return NextResponse.json(
      { count: founderCount, remaining, isFull: founderCount >= FOUNDING_MEMBER_LIMIT },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[founders/count] error:", err);
    return NextResponse.json({ count: 0, remaining: FOUNDING_MEMBER_LIMIT, isFull: false }, { status: 200 });
  }
}
