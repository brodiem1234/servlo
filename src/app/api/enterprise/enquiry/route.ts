import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      email?: string;
      businessName?: string;
      teamSize?: string;
      message?: string;
    };

    const { name, email, businessName, teamSize, message } = body;

    if (!name || !email || !businessName || !teamSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!resend) {
      console.error('[enterprise/enquiry] Resend not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'SERVLO <notifications@servlo.com.au>',
      to: 'hello@servlo.com.au',
      subject: `Enterprise enquiry from ${name} — ${businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#f8fafc">
          <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
            <h2 style="color:#0f172a;margin:0 0 24px">New Enterprise Enquiry</h2>

            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:14px;width:140px">Name</td>
                <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:14px">Email</td>
                <td style="padding:8px 0;color:#0f172a;font-size:14px">
                  <a href="mailto:${email}" style="color:#0891b2">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:14px">Business</td>
                <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600">${businessName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:14px">Team size</td>
                <td style="padding:8px 0;color:#0f172a;font-size:14px">${teamSize}</td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:14px;vertical-align:top">Message</td>
                <td style="padding:8px 0;color:#0f172a;font-size:14px">${message.replace(/\n/g, '<br>')}</td>
              </tr>
              ` : ''}
            </table>

            <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0">
              <a href="mailto:${email}?subject=Re: Enterprise enquiry — SERVLO"
                style="display:inline-block;background:#0891b2;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                Reply to ${name}
              </a>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px">
            Sent from SERVLO enterprise contact form
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[enterprise/enquiry] error:', err);
    return NextResponse.json({ error: 'Failed to send enquiry' }, { status: 500 });
  }
}
