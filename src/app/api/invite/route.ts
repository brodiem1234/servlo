import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const INVITE_ROLES = new Set(["employee", "contractor", "client"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const { email, role, businessId, businessName, inviterName } = await req.json();
    if (!email || !role || !businessId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!INVITE_ROLES.has(String(role))) {
      return NextResponse.json({ error: "Invalid invite role" }, { status: 400 });
    }

    const authed = await createClient();
    const {
      data: { user },
    } = await authed.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("owner_id, business_name")
      .eq("id", businessId)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create invite record
    const token = crypto.randomUUID();
    const { error: inviteError } = await supabase.from("invites").upsert({
      email,
      role,
      business_id: businessId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (inviteError) throw inviteError;

    // Send invite email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`;
    const safeInviterName = escapeHtml(String(inviterName || user.email || "A SERVLO user"));
    const safeBusinessName = escapeHtml(String(business.business_name || businessName || "your business"));
    const safeRole = escapeHtml(String(role));
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `${inviterName || user.email || "A SERVLO user"} invited you to join ${business.business_name || businessName || "your business"} on SERVLO`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <h2 style="color:#3B82F6">You've been invited to SERVLO</h2>
          <p>${safeInviterName} has invited you to join <strong>${safeBusinessName}</strong> as a ${safeRole}.</p>
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
