import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/feedback/upvote
 * Body: { requestId: string }
 * Toggles an upvote on a feature request.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { requestId?: string };
  try { body = await req.json(); } catch { body = {}; }

  if (!body.requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check if already upvoted
  const { data: existing } = await admin
    .from("feature_request_upvotes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("request_id", body.requestId)
    .maybeSingle();

  if (existing) {
    // Remove upvote
    await admin
      .from("feature_request_upvotes")
      .delete()
      .eq("user_id", user.id)
      .eq("request_id", body.requestId);

    await admin.rpc("decrement_feature_request_upvotes" as never, { request_id: body.requestId } as never);
    // Fallback: manually decrement
    const { data: fr } = await admin
      .from("feature_requests")
      .select("upvotes")
      .eq("id", body.requestId)
      .single();
    const newCount = Math.max(0, (fr?.upvotes ?? 0) - 1);
    await admin.from("feature_requests").update({ upvotes: newCount }).eq("id", body.requestId);

    return NextResponse.json({ ok: true, upvoted: false, upvotes: newCount });
  } else {
    // Add upvote
    await admin
      .from("feature_request_upvotes")
      .insert({ user_id: user.id, request_id: body.requestId });

    const { data: fr } = await admin
      .from("feature_requests")
      .select("upvotes")
      .eq("id", body.requestId)
      .single();
    const newCount = (fr?.upvotes ?? 0) + 1;
    await admin.from("feature_requests").update({ upvotes: newCount }).eq("id", body.requestId);

    return NextResponse.json({ ok: true, upvoted: true, upvotes: newCount });
  }
}
