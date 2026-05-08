import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** PUT /api/automations/[id] — update an automation */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    trigger_status?: string;
    action_type?: string;
    email_subject?: string | null;
    message_body?: string;
    is_active?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (body.trigger_status !== undefined) updates.trigger_status = body.trigger_status;
  if (body.action_type !== undefined) updates.action_type = body.action_type;
  if ("email_subject" in body) updates.email_subject = body.email_subject ?? null;
  if (body.message_body !== undefined) updates.message_body = body.message_body;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("job_automations")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/automations/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { error: deleteErr } = await admin
    .from("job_automations")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
