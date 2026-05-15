import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Whitelist of columns a client can PATCH. Anything else in the body is
// ignored — stops a malicious request from rewriting owner_id, business_id,
// created_at, etc.
const ALLOWED_UPDATE_FIELDS = new Set([
  "name",
  "doc_type",
  "template_key",
  "status",
  "signed_at",
  "expiry_date",
  "job_id",
  "file_url",
  "notes",
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sanitised: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) sanitised[key] = value;
  }
  if (Object.keys(sanitised).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  sanitised.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("compliance_documents")
    .update(sanitised)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { error } = await supabase.from("compliance_documents").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
