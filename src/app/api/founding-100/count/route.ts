import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOUNDING_MEMBER_LIMIT, getFoundingMemberCount } from "@/lib/founding-members";

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
export async function GET(_req: NextRequest) {
  try {
    const admin = createAdminClient();
    const founderCount = await getFoundingMemberCount(admin);
    const remaining = Math.max(0, FOUNDING_MEMBER_LIMIT - founderCount);

    return NextResponse.json(
      { count: founderCount, remaining, isFull: founderCount >= FOUNDING_MEMBER_LIMIT, limit: FOUNDING_MEMBER_LIMIT },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[founding-100/count] error:", err);
    return NextResponse.json(
      { count: FOUNDING_MEMBER_LIMIT, remaining: 0, isFull: true, limit: FOUNDING_MEMBER_LIMIT },
      { status: 200 }
    );
  }
}
