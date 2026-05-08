import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["scheduled", "in_progress", "completed", "invoiced", "cancelled"];
const VALID_ACTIONS = ["email", "sms"];

/** GET /api/automations — list all automations for the authenticated owner */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("job_automations")
    .select("id, trigger_status, action_type, email_subject, message_body, is_active")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ automations: data ?? [] });
}

/** POST /api/automations — create a new automation */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    trigger_status?: string;
    action_type?: string;
    email_subject?: string;
    message_body?: string;
    is_active?: boolean;
  };

  if (!body.trigger_status || !VALID_STATUSES.includes(body.trigger_status)) {
    return NextResponse.json({ error: "Invalid trigger_status" }, { status: 400 });
  }
  if (!body.action_type || !VALID_ACTIONS.includes(body.action_type)) {
    return NextResponse.json({ error: "Invalid action_type" }, { status: 400 });
  }
  if (!body.message_body?.trim()) {
    return NextResponse.json({ error: "message_body is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: insertErr } = await admin
    .from("job_automations")
    .insert({
      owner_id: user.id,
      trigger_status: body.trigger_status,
      action_type: body.action_type,
      email_subject: body.email_subject ?? null,
      message_body: body.message_body,
      is_active: body.is_active ?? true,
    })
    .select("id")
    .maybeSingle();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}
