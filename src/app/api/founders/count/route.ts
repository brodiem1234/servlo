import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/founders/count
 * Returns the current founding member count.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_founding_member", true);

    const founderCount = count ?? 0;
    const remaining = Math.max(0, 100 - founderCount);

    return NextResponse.json(
      { count: founderCount, remaining },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[founders/count] error:", err);
    return NextResponse.json({ count: 0, remaining: 100 }, { status: 200 });
  }
}
