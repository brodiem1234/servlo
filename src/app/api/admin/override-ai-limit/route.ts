import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const admin_check = await checkAdminAccess();
  if (!admin_check) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let email: string;
  let limit: number;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    limit = Number(body.limit);
  } else {
    const formData = await req.formData();
    email = String(formData.get("email") ?? "").trim().toLowerCase();
    limit = Number(formData.get("limit") ?? "");
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (isNaN(limit) || limit < 0) {
    return NextResponse.json(
      { error: "Limit must be a non-negative integer" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Find user by email
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, plan")
    .eq("email", email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Apply the override
  const { error } = await admin
    .from("profiles")
    .update({ ai_limit_override: limit })
    .eq("id", (profile as { id: string }).id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `AI limit for ${email} set to ${limit} calls/month`,
    userId: (profile as { id: string }).id,
    plan: (profile as { plan?: string }).plan ?? "unknown",
    newLimit: limit,
  });
}

export async function DELETE(req: NextRequest) {
  const admin_check = await checkAdminAccess();
  if (!admin_check) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email query param required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ ai_limit_override: null })
    .eq("id", (profile as { id: string }).id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `AI limit override removed for ${email}` });
}
