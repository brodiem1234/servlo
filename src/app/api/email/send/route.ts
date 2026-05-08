import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getBusinessBrand } from "@/lib/business-brand";

/**
 * POST /api/email/send
 * Sends an outbound email to a client and records it in the thread.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    thread_id?: string;
    client_id?: string;
    job_id?: string;
    to_email: string;
    subject: string;
    body_html: string;
    body_text?: string;
  };

  if (!body.to_email || !body.subject || !body.body_html) {
    return NextResponse.json({ error: "to_email, subject and body_html are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const brand = await getBusinessBrand(user.id);
  const fromName = brand.emailFromName || brand.businessName || "SERVLO";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@servlo.com.au";

  let threadId = body.thread_id;

  // Create thread if not supplied
  if (!threadId) {
    const { data: thread, error: threadErr } = await admin
      .from("email_threads")
      .insert({
        owner_id: user.id,
        client_id: body.client_id ?? null,
        job_id: body.job_id ?? null,
        subject: body.subject,
        last_message_at: new Date().toISOString(),
        message_count: 0,
      })
      .select("id")
      .maybeSingle();
    if (threadErr || !thread) {
      return NextResponse.json({ error: threadErr?.message ?? "Could not create thread" }, { status: 500 });
    }
    threadId = thread.id;
  }

  // Send via Resend
  let resendId: string | null = null;
  let status: "sent" | "failed" = "sent";
  try {
    await sendEmail(body.to_email, body.subject, body.body_html, `${fromName} <${fromEmail}>`);
    resendId = null; // sendEmail doesn't return id; could be extended later
  } catch {
    status = "failed";
  }

  // Record the message
  const now = new Date().toISOString();
  const { error: msgErr } = await admin.from("email_messages").insert({
    thread_id: threadId,
    owner_id: user.id,
    direction: "outbound",
    from_email: fromEmail,
    to_email: body.to_email,
    subject: body.subject,
    body_html: body.body_html,
    body_text: body.body_text ?? null,
    resend_id: resendId,
    status,
    sent_at: now,
  });
  if (msgErr) {
    console.error("[email/send] message insert error:", msgErr);
  }

  // Update thread last_message_at and increment count
  await admin.rpc("email_thread_bump" as never, { p_thread_id: threadId, p_sent_at: now }).maybeSingle().catch(() => {
    // Fallback: direct update if RPC not available
    return admin
      .from("email_threads")
      .update({ last_message_at: now })
      .eq("id", threadId!);
  });

  if (status === "failed") {
    return NextResponse.json({ error: "Email delivery failed", thread_id: threadId }, { status: 500 });
  }

  return NextResponse.json({ ok: true, thread_id: threadId });
}
