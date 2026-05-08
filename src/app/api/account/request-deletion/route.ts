import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/account/request-deletion
 * Schedules account for deletion 30 days from now.
 * Sends a confirmation email with the deletion date.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const completesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const admin = createAdminClient();
    await admin.from("profiles").update({
      deletion_requested_at: now.toISOString(),
      deletion_completes_at: completesAt.toISOString(),
    }).eq("id", user.id);

    const dateStr = completesAt.toLocaleDateString("en-AU", { dateStyle: "long" });

    await sendEmail(
      user.email!,
      "Your SERVLO account deletion is scheduled",
      `<p>We've received your account deletion request.</p>
       <p>Your account and all associated data will be permanently deleted on <strong>${dateStr}</strong>.</p>
       <p>If you change your mind, simply log in to SERVLO before that date and cancel the deletion from your Settings page.</p>
       <p>We're sorry to see you go. If there's anything we could have done better, please reply to this email.</p>`
    );

    return NextResponse.json({ ok: true, completesAt: completesAt.toISOString() });
  } catch (err) {
    console.error("[account/request-deletion] error:", err);
    return NextResponse.json({ error: "Failed to schedule deletion" }, { status: 500 });
  }
}
