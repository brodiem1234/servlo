import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/founding-100/count
 *
 * DEPRECATED route name — kept for compatibility with anything that still
 * calls it. Source of truth is `profiles.is_founding_member` (matches
 * `/api/founders/count`). Always returns the same count as that endpoint.
 *
 * Brodie: once nothing references this URL, you can delete the file. The
 * canonical endpoint is /api/founders/count.
 */
const FOUNDING_LIMIT = 50;

export async function GET(_req: NextRequest) {
  try {
    const admin = createAdminClient();

    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_founding_member", true);

    const founderCount = count ?? 0;
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
