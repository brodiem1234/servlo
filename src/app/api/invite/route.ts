import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import crypto from "crypto";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Create or refresh a team invitation. Writes to `team_invitations` (the real
 * table — there is no `invites` table) and emails the invitee a link to the
 * canonical accept route at `/invite/[token]`.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, role, businessId, businessName, inviterName, inviterUserId, personalMessage } = await req.json();

    if (!email || !role || !businessId || !inviterUserId) {
      return NextResponse.json(
        { error: "Missing required fields: email, role, businessId, inviterUserId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Reject if there's already an accepted invitation for this email + business
    const { data: existingAccepted } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("business_id", businessId)
      .eq("invited_email", email.toLowerCase())
      .eq("status", "accepted")
      .maybeSingle();

    if (existingAccepted) {
      return NextResponse.json(
        { error: "This person has already accepted an invitation to this business." },
        { status: 409 }
      );
    }

    // Upsert pending invitation (refresh expiry on resend)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("team_invitations")
      .insert({
        business_id: businessId,
        invited_by_user_id: inviterUserId,
        invited_email: email.toLowerCase(),
        role,
        invite_token: token,
        status: "pending",
        personal_message: personalMessage ?? null,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("[invite] team_invitations insert failed:", insertError);
      return NextResponse.json(
        { error: insertError.message ?? "Failed to record invitation" },
        { status: 500 }
      );
    }

    // Build the canonical accept URL — points at /invite/[token] which is the
    // page that actually exists in the app router.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
    const inviteUrl = `${appUrl}/invite/${token}`;

    if (!resend) {
      console.warn("[invite] RESEND_API_KEY missing — invitation recorded but no email sent");
      return NextResponse.json({ success: true, emailSent: false });
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "SERVLO <hello@servlo.com.au>",
        to: email,
        subject: `${inviterName} invited you to join ${businessName} on SERVLO`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#0f172a">
            <h2 style="font-size:22px;font-weight:800;margin:0 0 16px;color:#0f172a">You've been invited to SERVLO</h2>
            <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 24px">
              <strong>${inviterName}</strong> invited you to join <strong>${businessName}</strong> as a <strong>${role}</strong>.
            </p>
            ${personalMessage ? `<blockquote style="border-left:3px solid #0A0A0A;padding:8px 16px;margin:16px 0;color:#475569;font-style:italic">"${personalMessage}"</blockquote>` : ""}
            <a href="${inviteUrl}" style="display:inline-block;background:#0A0A0A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0">
              Accept invitation
            </a>
            <p style="color:#64748b;font-size:13px;margin-top:32px">
              This link expires in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">
              SERVLO — operated by Brodie McDonald, ABN 88 688 301 684
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("[invite] Resend send failed:", mailErr);
      // Invitation is recorded — caller can hit /resend if email failed.
      return NextResponse.json({ success: true, emailSent: false });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (err) {
    console.error("[invite] error:", err);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
