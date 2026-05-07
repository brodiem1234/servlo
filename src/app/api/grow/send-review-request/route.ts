import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { clientName, clientEmail, businessName, jobTitle } = (await req.json()) as {
    clientName?: string;
    clientEmail?: string;
    businessName?: string;
    jobTitle?: string;
  };

  if (!clientEmail) {
    return NextResponse.json({ error: "Missing client email" }, { status: 400 });
  }

  const subject = `How did we do? Share your feedback for ${businessName ?? "our recent job"}`;

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#8B5CF6;padding:20px 24px;">
          <span style="font-size:20px;font-weight:700;color:white;">⭐ ${businessName ?? "Your Tradie"}</span>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Hi ${clientName ?? "there"},</h2>
          <p style="color:#334155;margin:0 0 16px;">Thank you for choosing us${jobTitle ? ` for your "${jobTitle}" job` : ""}. We hope everything went smoothly!</p>
          <p style="color:#334155;margin:0 0 20px;">We'd really appreciate it if you could take 2 minutes to leave us a Google review. Your feedback helps other locals find a tradie they can trust.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="https://g.page/r/review" style="display:inline-block;background:#8B5CF6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Leave a Google Review ⭐</a>
          </p>
          <p style="color:#64748b;font-size:13px;margin:0;">Thank you for your support — it means the world to us!</p>
          <p style="color:#64748b;font-size:13px;margin:8px 0 0;">— The team at ${businessName ?? "Your Business"}</p>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">This email was sent via SERVLO on behalf of ${businessName ?? "your service provider"}.</p>
        </div>
      </div>
    </div>
  `;

  const result = await sendEmail(clientEmail, subject, html);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
