import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/email/inbound
 * Webhook endpoint for inbound email forwarding (e.g. Resend inbound routing).
 * Matches the sender email to a client and inserts into the correct thread.
 *
 * Expected payload (Resend inbound webhook format):
 * { from, to, subject, html, text, headers: { "message-id": string } }
 */
export async function POST(req: NextRequest) {
  // Verify shared secret if configured
  const secret = process.env.EMAIL_INBOUND_SECRET;
  if (secret) {
    const authHeader = req.headers.get("x-inbound-secret");
    if (authHeader !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({})) as {
    from?: string;
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
  };

  const fromEmail = body.from ?? "";
  const subject = body.subject ?? "(no subject)";
  const bodyHtml = body.html ?? null;
  const bodyText = body.text ?? null;
  const resendId = body.headers?.["message-id"] ?? null;

  if (!fromEmail) {
    return NextResponse.json({ error: "Missing from email" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find a client with this email address
  const { data: client } = await admin
    .from("clients")
    .select("id, owner_id, email")
    .eq("email", fromEmail)
    .maybeSingle();

  if (!client) {
    // Unknown sender — record as orphan thread under first matching owner? Skip for now.
    return NextResponse.json({ ok: true, note: "no matching client" });
  }

  const now = new Date().toISOString();

  // Find or create a thread for this client with a matching subject
  let threadId: string | null = null;
  const { data: existingThread } = await admin
    .from("email_threads")
    .select("id")
    .eq("owner_id", client.owner_id)
    .eq("client_id", client.id)
    .eq("subject", subject)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingThread) {
    threadId = existingThread.id;
  } else {
    const { data: newThread } = await admin
      .from("email_threads")
      .insert({
        owner_id: client.owner_id,
        client_id: client.id,
        subject,
        last_message_at: now,
        message_count: 0,
      })
      .select("id")
      .maybeSingle();
    threadId = newThread?.id ?? null;
  }

  if (!threadId) {
    return NextResponse.json({ error: "Could not create/find thread" }, { status: 500 });
  }

  // Insert inbound message
  await admin.from("email_messages").insert({
    thread_id: threadId,
    owner_id: client.owner_id,
    direction: "inbound",
    from_email: fromEmail,
    to_email: typeof body.to === "string" ? body.to : (body.to?.[0] ?? ""),
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
    resend_id: resendId,
    status: "delivered",
    received_at: now,
  });

  // Bump the thread
  await admin
    .from("email_threads")
    .update({ last_message_at: now })
    .eq("id", threadId);

  return NextResponse.json({ ok: true, thread_id: threadId });
}
