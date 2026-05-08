import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/sms/send
 * Body: { to: string; body: string; job_id?: string; type?: string }
 * Authenticated — owner only.
 * Logs to audit_log on success.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { to, body: smsBody, job_id, type = "manual_sms" } = body as {
      to?: string;
      body?: string;
      job_id?: string;
      type?: string;
    };

    if (!to || !smsBody) {
      return NextResponse.json({ error: "to and body are required" }, { status: 400 });
    }

    const result = await sendSms(to, smsBody);

    if (result.ok) {
      // Audit log
      await logAudit({
        ownerId: user.id,
        action: type,
        entityType: job_id ? "job" : "sms",
        entityId: job_id ?? result.sid ?? "",
        metadata: { to, sid: result.sid },
        request: req,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[sms/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
