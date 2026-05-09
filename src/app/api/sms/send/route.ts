import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/sms";

/**
 * POST /api/sms/send
 * Body: { to_number: string; message: string; client_id?: string; thread_id?: string }
 *   (also accepts legacy: { to: string; body: string; job_id?: string })
 * Authenticated — owner only.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await req.json().catch(() => ({})) as {
      // new params
      to_number?: string;
      message?: string;
      client_id?: string;
      thread_id?: string;
      // legacy params
      to?: string;
      body?: string;
      job_id?: string;
    };

    const toNumber = payload.to_number ?? payload.to;
    const messageText = payload.message ?? payload.body;

    if (!toNumber || !messageText) {
      return NextResponse.json({ error: "to_number and message are required" }, { status: 400 });
    }

    const result = await sendSms(toNumber, messageText);
    const isStub = !result.ok || result.sid === "dev-noop";

    // Persist to sms_messages table (graceful if table missing)
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const fromNumber = process.env.TWILIO_FROM_NUMBER ?? null;

    try {
      const { data: msg } = await admin
        .from("sms_messages")
        .insert({
          owner_id: user.id,
          client_id: payload.client_id ?? null,
          thread_id: payload.thread_id ?? null,
          to_number: toNumber,
          from_number: fromNumber,
          message: messageText,
          direction: "outbound",
          status: result.ok ? "sent" : "failed",
          sent_at: now,
          is_stub: isStub,
          external_id: result.sid && result.sid !== "dev-noop" ? result.sid : null,
        })
        .select("id")
        .maybeSingle();

      return NextResponse.json({
        success: result.ok,
        stub: isStub,
        message_id: msg?.id ?? "stub",
        ...(result.error ? { error: result.error } : {}),
      });
    } catch {
      // sms_messages table not yet created — return stub response
      return NextResponse.json({ success: true, stub: true, message_id: "stub" });
    }
  } catch (err) {
    console.error("[sms/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
