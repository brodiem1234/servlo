import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const FOUNDERS_CAP = 100;

export async function POST(req: NextRequest) {
  const admin_check = await checkAdminAccess();
  if (!admin_check) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let email: string;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } else {
    const formData = await req.formData();
    email = String(formData.get("email") ?? "").trim().toLowerCase();
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check current founders count
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_founding_member", true);

  if ((count ?? 0) >= FOUNDERS_CAP) {
    return NextResponse.json(
      { error: `Founders cap of ${FOUNDERS_CAP} has been reached` },
      { status: 400 }
    );
  }

  // Find user by email
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, is_founding_member")
    .eq("email", email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if ((profile as { is_founding_member?: boolean }).is_founding_member) {
    return NextResponse.json({ ok: true, message: "User is already a founding member" });
  }

  // Grant founding member status
  const { error } = await admin
    .from("profiles")
    .update({ is_founding_member: true })
    .eq("id", (profile as { id: string }).id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert founding member notification for the user
  await admin.from("notifications").insert({
    owner_id: (profile as { id: string }).id,
    type: "founding_member",
    title: "You're a Founding Member!",
    body: "Welcome to the SERVLO Founding Member club. Thank you for your early support.",
    href: "/dashboard/owner/settings/billing",
    read: false,
  });

  return NextResponse.json({
    ok: true,
    message: `Founding member status granted to ${email}`,
    slotsUsed: (count ?? 0) + 1,
  });
}
