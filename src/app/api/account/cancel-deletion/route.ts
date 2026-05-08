import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/account/cancel-deletion
 * Cancels a previously scheduled account deletion.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    await admin.from("profiles").update({
      deletion_requested_at: null,
      deletion_completes_at: null,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/cancel-deletion] error:", err);
    return NextResponse.json({ error: "Failed to cancel deletion" }, { status: 500 });
  }
}
