import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referredName, referredEmail, businessName, referralCode } = (await req.json()) as {
    referredName?: string;
    referredEmail?: string;
    businessName?: string;
    referralCode?: string;
  };

  if (!referredEmail) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const referralLink = `https://servlo.app/ref/${referralCode ?? ""}`;

  // Insert referral row
  const { error: insertError } = await supabase.from("grow_referrals").insert({
    owner_id: user.id,
    referred_email: referredEmail,
    referred_name: referredName ?? null,
    status: "pending",
    reward_amount: 50,
  });

  if (insertError) {
    console.error("[send-referral] insert error", insertError);
    // Continue anyway — don't block the email
  }

  const subject = `${businessName ?? "Your contact"} thinks SERVLO could help your business`;

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#8B5CF6;padding:20px 24px;">
          <span style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">SERVLO</span>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Hi ${referredName ?? "there"},</h2>
          <p style="color:#334155;margin:0 0 16px;">
            ${businessName ?? "A fellow trade business owner"} thought you might benefit from using SERVLO — the business management platform built specifically for Australian service businesses like yours.
          </p>
          <p style="color:#334155;margin:0 0 16px;">
            SERVLO helps tradies and service businesses manage jobs, quotes, invoices, clients, and team — all in one place. No more spreadsheets, no more chasing payments.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f172a;">Founding 50 — lock in pricing for life</p>
            <p style="margin:0;font-size:13px;color:#64748b;">Sign up via the link below. 30-day money-back guarantee, no risk.</p>
          </div>
          <p style="text-align:center;margin:24px 0;">
            <a href="${referralLink}" style="display:inline-block;background:#0A0A0A;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Start my SERVLO subscription →</a>
          </p>
          <p style="color:#64748b;font-size:12px;margin:0;">Or copy this link: ${referralLink}</p>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">You received this email because ${businessName ?? "someone you know"} referred you to SERVLO. If this was a mistake, simply ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  const result = await sendEmail(referredEmail, subject, html);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
