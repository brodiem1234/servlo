import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/founders/count
 * Returns the current founding member count.
 * Public endpoint — no auth required.
 */
const FOUNDING_LIMIT = 50;

export async function GET(req: NextRequest) {
  // ?preview=N — returns synthetic data for UI testing without auth
  const { searchParams } = new URL(req.url);
  const previewParam = searchParams.get("preview");
  if (previewParam !== null) {
    const n = Math.min(FOUNDING_LIMIT, Math.max(0, parseInt(previewParam, 10) || 0));
    return NextResponse.json(
      { count: n, remaining: FOUNDING_LIMIT - n, isFull: n >= FOUNDING_LIMIT },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimitResponse = await checkRateLimit("foundersCount", "global");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_founding_member", true);

    const founderCount = count ?? 0;
    const remaining = Math.max(0, FOUNDING_LIMIT - founderCount);

    return NextResponse.json(
      { count: founderCount, remaining, isFull: founderCount >= FOUNDING_LIMIT },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[founders/count] error:", err);
    return NextResponse.json({ count: 0, remaining: FOUNDING_LIMIT, isFull: false }, { status: 200 });
  }
}
