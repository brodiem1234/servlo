import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin_check = await checkAdminAccess();
  if (!admin_check) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let subject: string;
  let message: string;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    subject = body.subject ?? "";
    message = body.message ?? "";
  } else {
    const formData = await req.formData();
    subject = String(formData.get("subject") ?? "");
    message = String(formData.get("message") ?? "");
  }

  if (!subject.trim() || !message.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get all users with email addresses
  const { data: profiles } = await admin
    .from("profiles")
    .select("email")
    .neq("email", null);

  const emails = (profiles ?? [])
    .map((p) => (p as { email?: string }).email)
    .filter(Boolean) as string[];

  if (emails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No users to email" });
  }

  // Send in batches of 50 to avoid rate limits
  const BATCH_SIZE = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (email) => {
        const result = await sendEmail(email, subject, message);
        if (result.ok) sent++;
        else failed++;
      })
    );
  }

  return NextResponse.json({ ok: true, sent, failed, total: emails.length });
}
