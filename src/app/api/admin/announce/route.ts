import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * Admin broadcast email. Sends to every user with `email_digest_enabled = true`.
 *
 * SAFETY: requires `confirmation: "SEND TO ALL"` in the body to prevent an
 * accidental click from emailing every customer. Also appends an unsubscribe
 * notice and an audit row so we can prove what was sent and when.
 */
export async function POST(req: NextRequest) {
  const admin_check = await checkAdminAccess();
  if (!admin_check) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let subject: string;
  let message: string;
  let confirmation: string;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    subject = body.subject ?? "";
    message = body.message ?? "";
    confirmation = body.confirmation ?? "";
  } else {
    const formData = await req.formData();
    subject = String(formData.get("subject") ?? "");
    message = String(formData.get("message") ?? "");
    confirmation = String(formData.get("confirmation") ?? "");
  }

  if (!subject.trim() || !message.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  // Type-confirm gate. Sender has to type "SEND TO ALL" exactly.
  if (confirmation !== "SEND TO ALL") {
    return NextResponse.json(
      { error: "Confirmation required. Send `confirmation: \"SEND TO ALL\"` in the request body." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Only email users who haven't opted out of digests.
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, email_digest_enabled")
    .neq("email", null)
    .eq("email_digest_enabled", true);

  const recipients = (profiles ?? [])
    .map((p) => p as { id: string; email?: string })
    .filter((p): p is { id: string; email: string } => Boolean(p.email));

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0, message: "No opted-in users" });
  }

  // Append a footer that identifies sender and offers unsubscribe path.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
  const wrappedBody = `${message}
    <hr style="border:0;border-top:1px solid #e5e5e5;margin:32px 0 16px"/>
    <p style="color:#737373;font-size:12px;line-height:1.5">
      This email was sent by SERVLO — operated by Brodie McDonald, ABN 88 688 301 684.<br/>
      <a href="${appUrl}/dashboard/owner/settings/privacy" style="color:#737373">Manage your email preferences</a>.
    </p>`;

  // Audit row before sending — if we crash mid-broadcast, we know what was attempted.
  await admin.from("admin_announcements").insert({
    sent_by: admin_check.userId,
    subject,
    body: message,
    recipient_count: recipients.length,
    confirmation_text: confirmation,
  }).then(undefined, () => {
    // audit_announcements table may not exist yet — don't block the send
    console.warn("[announce] admin_announcements audit insert failed (table may not exist yet)");
  });

  // Batch sends to avoid Resend rate limits
  const BATCH_SIZE = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (r) => {
        const result = await sendEmail(r.email, subject, wrappedBody);
        if (result.ok) sent++;
        else failed++;
      })
    );
  }

  return NextResponse.json({ ok: true, sent, failed, total: recipients.length });
}
