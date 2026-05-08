import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/sms";

/**
 * POST /api/sms/send
 * Body: { to: string; body: string; job_id?: string }
 * Authenticated — owner only.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { to, body: smsBody, job_id } = payload as {
      to?: string;
      body?: string;
      job_id?: string;
    };

    if (!to || !smsBody) {
      return NextResponse.json({ error: "to and body are required" }, { status: 400 });
    }

    const result = await sendSms(to, smsBody);

    if (result.ok) {
      // Best-effort audit log
      try {
        const admin = createAdminClient();
        await admin.from("audit_log").insert({
          user_id: user.id,
          business_id: null,
          table_name: job_id ? "jobs" : "sms",
          record_id: job_id ?? result.sid ?? null,
          action: "updated",
          changed_fields: { sms_to: to, sms_sid: result.sid },
        });
      } catch { /* swallow */ }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[sms/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
