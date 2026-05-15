import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referralId, referredEmail, referredName, businessName, referralCode } = (await req.json()) as {
    referralId?: string;
    referredEmail?: string;
    referredName?: string;
    businessName?: string;
    referralCode?: string;
  };

  if (!referredEmail) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const referralLink = `https://servlo.app/ref/${referralCode ?? ""}`;

  const subject = `Just checking in — have you had a chance to try SERVLO?`;

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#8B5CF6;padding:20px 24px;">
          <span style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">SERVLO</span>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Hi ${referredName ?? "there"},</h2>
          <p style="color:#334155;margin:0 0 16px;">
            We noticed you haven't signed up yet after ${businessName ?? "your contact"} referred you to SERVLO. We just wanted to check in!
          </p>
          <p style="color:#334155;margin:0 0 16px;">
            SERVLO is the all-in-one business management platform for Australian tradies and service businesses. Manage jobs, quotes, invoices, and your team — all in one place.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f172a;">Founding 50 spots still open</p>
            <p style="margin:0;font-size:13px;color:#64748b;">Lock in pricing for life. 30-day money-back. Cancel anytime.</p>
          </div>
          <p style="text-align:center;margin:24px 0;">
            <a href="${referralLink}" style="display:inline-block;background:#0A0A0A;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Start my SERVLO subscription →</a>
          </p>
          <p style="color:#64748b;font-size:12px;margin:0;">Or copy this link: ${referralLink}</p>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">This follow-up was sent on behalf of ${businessName ?? "your referrer"} via SERVLO.</p>
        </div>
      </div>
    </div>
  `;

  const result = await sendEmail(referredEmail, subject, html);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Update referral row to mark chase-up sent (optional — no column for this so just log)
  if (referralId) {
    await supabase
      .from("grow_referrals")
      .update({ chased_up_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", referralId)
      .eq("owner_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
