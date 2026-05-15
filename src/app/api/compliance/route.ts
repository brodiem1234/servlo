import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertSubscriptionActive } from "@/lib/pause-check";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const subBlock = await assertSubscriptionActive(user.id);
  if (subBlock) return subBlock;

  const body = await req.json().catch(() => ({}));
  const { name, doc_type, template_key, job_id } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("compliance_documents")
    .insert({ owner_id: user.id, name: name.trim(), doc_type: doc_type ?? "SWMS", template_key: template_key ?? null, job_id: job_id ?? null, status: "draft" })
    .select("id, name, doc_type, template_key, status, signed_at, expiry_date, job_id, created_at")
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations first." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ doc: data }, { status: 201 });
}
