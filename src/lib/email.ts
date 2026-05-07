import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SERVLO <hello@servlo.com.au>";
const HELLO_FROM = "SERVLO <hello@servlo.com.au>";

export async function sendEmail(to: string, subject: string, html: string, fromOverride?: string) {
  if (!to) return { ok: false, error: "Missing recipient email" };
  if (!resend) {
    console.error("Email send skipped: RESEND_API_KEY missing");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  try {
    await resend.emails.send({
      from: fromOverride ?? FROM_EMAIL,
      to,
      subject,
      html
    });
    return { ok: true };
  } catch (error) {
    console.error("Resend sendEmail error", error);
    return { ok: false, error: String(error) };
  }
}

function wrapEmail(content: string, accentHex = "#0891B2") {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:${accentHex};padding:20px 24px;">
          <span style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">SERVLO</span>
        </div>
        <div style="padding:24px;">
          ${content}
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">This email was sent by SERVLO on behalf of your service provider. Reply directly to contact them.</p>
        </div>
      </div>
    </div>
  `;
}

export function invoiceSentEmailTemplate(args: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  dueDate: string;
  subtotal: string;
  gst: string;
  total: string;
  accentHex?: string;
  appUrl?: string;
  /** Stripe Payment Link URL — when present, a prominent Pay Now button is shown. */
  payNowUrl?: string | null;
}) {
  const accent = args.accentHex ?? "#0891B2";
  const portalUrl = `${args.appUrl ?? "https://servlo.com.au"}/dashboard/client`;
  const payNowBlock = args.payNowUrl
    ? `<p style="margin:20px 0 0;">
        <a href="${args.payNowUrl}" style="display:inline-block;background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">Pay Now</a>
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Secure payment via Stripe</p>`
    : "";
  return wrapEmail(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Invoice from ${args.businessName}</h2>
    <p style="margin:0 0 20px;color:#64748b;">Hi ${args.clientName},</p>
    <p style="color:#334155;">Please find your invoice details below.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Invoice number</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Due date</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.dueDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.subtotal}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">GST (10%)</td>
        <td style="padding:8px 0;text-align:right;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.gst}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 8px;font-weight:700;font-size:16px;color:#0f172a;">Total due</td>
        <td style="padding:12px 0 8px;text-align:right;font-weight:700;font-size:16px;color:#0f172a;">${args.total}</td>
      </tr>
    </table>

    ${payNowBlock}

    <p style="margin:20px 0 0;">
      <a href="${portalUrl}" style="display:inline-block;background:${accent};color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Invoice</a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Or copy this link: ${portalUrl}</p>
  `, accent);
}

export function quoteSentEmailTemplate(args: {
  clientName: string;
  businessName: string;
  quoteNumber: string;
  subtotal: string;
  gst: string;
  total: string;
  accentHex?: string;
  appUrl?: string;
}) {
  const accent = args.accentHex ?? "#0891B2";
  const portalUrl = `${args.appUrl ?? "https://servlo.com.au"}/dashboard/client`;
  return wrapEmail(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Quote from ${args.businessName}</h2>
    <p style="margin:0 0 20px;color:#64748b;">Hi ${args.clientName},</p>
    <p style="color:#334155;">We have prepared a quote for you. Please review the details below and contact us to accept or if you have any questions.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Quote number</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.quoteNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.subtotal}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">GST (10%)</td>
        <td style="padding:8px 0;text-align:right;color:#0f172a;border-bottom:1px solid #f1f5f9;">${args.gst}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 8px;font-weight:700;font-size:16px;color:#0f172a;">Total</td>
        <td style="padding:12px 0 8px;text-align:right;font-weight:700;font-size:16px;color:#0f172a;">${args.total}</td>
      </tr>
    </table>

    <p style="color:#334155;margin:16px 0;">To accept this quote or request changes, please contact us or use your client portal.</p>

    <p style="margin:20px 0 0;">
      <a href="${portalUrl}" style="display:inline-block;background:${accent};color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Quote</a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Or copy this link: ${portalUrl}</p>
  `, accent);
}

/** Legacy reminder template — kept for cron digest use. */
export function invoiceReminderEmailTemplate(args: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  payNowUrl: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Invoice Reminder</h2>
    <p>Hi ${args.clientName},</p>
    <p>This is a friendly reminder for invoice <strong>${args.invoiceNumber}</strong>.</p>
    <p>Amount: <strong>${args.amount}</strong><br/>Due date: <strong>${args.dueDate}</strong></p>
    <p><a href="${args.payNowUrl}" style="background:#0891B2;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Pay Now</a></p>
    <p style="color:#64748b;">Thank you,<br/>SERVLO Team</p>
  `);
}

/** Legacy follow-up template — kept for cron digest use. */
export function quoteFollowUpEmailTemplate(args: {
  clientName: string;
  quoteNumber: string;
  quoteDate: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Quote Follow-up</h2>
    <p>Hi ${args.clientName},</p>
    <p>We are following up on quote <strong>${args.quoteNumber}</strong> sent on ${args.quoteDate}.</p>
    <p>Please let us know if you would like to proceed or need any changes.</p>
    <p style="color:#64748b;">Thanks,<br/>SERVLO Team</p>
  `);
}

export function employeeAssignmentEmailTemplate(args: {
  employeeName: string;
  jobTitle: string;
  scheduledDate: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">New Job Assignment</h2>
    <p>Hi ${args.employeeName},</p>
    <p>You have been assigned to <strong>${args.jobTitle}</strong>.</p>
    <p>Scheduled date: <strong>${args.scheduledDate}</strong></p>
    <p style="color:#64748b;">Please check your SERVLO dashboard for details.</p>
  `);
}

export function portalShareEmailTemplate(args: {
  clientName: string;
  portalUrl: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Your SERVLO Client Portal</h2>
    <p>Hi ${args.clientName},</p>
    <p>You can view your quotes, invoices, and jobs using the portal link below:</p>
    <p><a href="${args.portalUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Open Portal</a></p>
    <p style="word-break:break-all;color:#64748b;">${args.portalUrl}</p>
  `);
}

export function welcomeOwnerEmailTemplate(args: {
  ownerName: string;
  dashboardUrl: string;
  supportUrl: string;
  industryLabel?: string | null;
  highlightFeatures?: string[];
}) {
  const industryLine =
    args.industryLabel?.trim() ?
      `<p style="color:#334155;">We&apos;ve tailored your workspace for <strong>${args.industryLabel.trim()}</strong>.</p>`
    : "";
  const highlights =
    args.highlightFeatures?.filter(Boolean).slice(0, 3) ?? [];
  const bullets =
    highlights.length > 0 ?
      `<ul style="margin:8px 0;padding-left:18px;color:#334155;line-height:1.6;">${highlights.map((h) => `<li>${h}</li>`).join("")}</ul>`
    : `<ul style="margin:8px 0;padding-left:18px;color:#334155;line-height:1.6;">
        <li>Add your first client and create a job so your calendar fills up.</li>
        <li>Send quotes from SERVLO so follow-ups stay organised.</li>
        <li>Use invoices with reminders to get paid on time.</li>
      </ul>`;

  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Welcome to SERVLO</h2>
    <p>Hi ${args.ownerName},</p>
    ${industryLine}
    <p style="color:#334155;">Your workspace is ready — here are three highlights we&apos;ve switched on for you:</p>
    ${bullets}
    <p><a href="${args.dashboardUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Go to dashboard</a></p>
    <p style="margin-top:16px;color:#334155;">You can turn modules on or off anytime under Settings → Features.</p>
    <p style="margin-top:16px;color:#334155;">Questions? <a href="${args.supportUrl}" style="color:#1e3a5f;font-weight:600;">Contact support</a>.</p>
    <p style="color:#64748b;">— SERVLO</p>
  `);
}

export function purchaseOrderEmailTemplate(args: {
  supplierName: string;
  businessName: string;
  poNumber: string;
  items: Array<{ description: string; quantity: number; unit_price: number }>;
  total: number;
  notes?: string | null;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#0891B2";
  const rows = args.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 4px;color:#334155;border-bottom:1px solid #f1f5f9;">${item.description}</td>
          <td style="padding:6px 4px;text-align:right;color:#334155;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
          <td style="padding:6px 4px;text-align:right;color:#334155;border-bottom:1px solid #f1f5f9;">$${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding:6px 4px;text-align:right;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>`
    )
    .join("");
  const notesBlock = args.notes
    ? `<p style="color:#64748b;font-size:13px;margin:12px 0 0;">Notes: ${args.notes}</p>`
    : "";
  return wrapEmail(
    `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Purchase Order from ${args.businessName}</h2>
    <p style="margin:0 0 20px;color:#64748b;">Dear ${args.supplierName},</p>
    <p style="color:#334155;">Please find the purchase order details below.</p>
    <p style="margin:16px 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;">PO Number: ${args.poNumber}</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 4px;text-align:left;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Description</th>
          <th style="padding:8px 4px;text-align:right;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Qty</th>
          <th style="padding:8px 4px;text-align:right;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Unit</th>
          <th style="padding:8px 4px;text-align:right;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:right;padding:12px 0;border-top:2px solid #e2e8f0;">
      <span style="font-size:16px;font-weight:700;color:#0f172a;">Total: $${args.total.toFixed(2)}</span>
    </div>
    ${notesBlock}
    <p style="color:#334155;margin:16px 0;">Please confirm receipt and proceed with the order. Contact us if you have any questions.</p>
    <p style="color:#64748b;">— ${args.businessName}</p>
  `,
    accent
  );
}

export function ownerDailyDigestEmailTemplate(args: {
  jobsSection: string;
  invoicesSection: string;
  quotesSection: string;
  dashboardUrl: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Your SERVLO morning snapshot</h2>
    <p style="color:#334155;">Here is what needs attention today.</p>
    <h3 style="margin:18px 0 8px;color:#0f172a;font-size:15px;">Jobs scheduled today</h3>
    ${args.jobsSection}
    <h3 style="margin:18px 0 8px;color:#0f172a;font-size:15px;">Outstanding invoices</h3>
    ${args.invoicesSection}
    <h3 style="margin:18px 0 8px;color:#0f172a;font-size:15px;">Quotes awaiting acceptance</h3>
    ${args.quotesSection}
    <p style="margin-top:20px;"><a href="${args.dashboardUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Open dashboard</a></p>
    <p style="color:#64748b;font-size:12px;">You can turn this email off in Settings → Notifications.</p>
  `);
}

