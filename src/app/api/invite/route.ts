import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { email, role, businessId, businessName, inviterName } = await req.json();
    if (!email || !role || !businessId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Create invite record
    const token = crypto.randomUUID();
    await supabase.from("invites").upsert({
      email,
      role,
      business_id: businessId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Send invite email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`;
    if (!resend) throw new Error("Email service not configured");
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `${inviterName} invited you to join ${businessName} on SERVLO`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <h2 style="color:#3B82F6">You've been invited to SERVLO</h2>
          <p>${inviterName} has invited you to join <strong>${businessName}</strong> as a ${role}.</p>
          <a href="${inviteUrl}" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Accept Invitation</a>
          <p style="color:#666;font-size:14px">This link expires in 7 days. If you didn't expect this invite, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
