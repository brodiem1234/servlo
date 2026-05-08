/**
 * SMS sending via Twilio.
 * Install: npm install twilio
 * Required env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * Until twilio package is installed, all send calls log + no-op in development.
 */

// TODO: npm install twilio
// import twilio from "twilio";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

function isConfigured(): boolean {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && FROM_NUMBER);
}

export interface SmsSendResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send an SMS to a mobile number.
 * Automatically formats Australian numbers (0400 → +61400).
 */
export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  if (!to || !body) return { ok: false, error: "Missing to or body" };

  const normalised = normaliseAuMobile(to);
  if (!normalised) return { ok: false, error: `Invalid mobile number: ${to}` };

  if (!isConfigured()) {
    console.info(`[sms] TWILIO not configured — would send to ${normalised}: ${body.slice(0, 60)}`);
    return { ok: true, sid: "dev-noop" };
  }

  try {
    // Dynamic require so the build doesn't fail when twilio isn't installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio");
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const message = await client.messages.create({
      body,
      from: FROM_NUMBER,
      to: normalised,
    });
    return { ok: true, sid: message.sid };
  } catch (err) {
    console.error("[sms] Twilio error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Normalise an Australian mobile to E.164 (+61...) */
export function normaliseAuMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("04") && digits.length === 10) return `+61${digits.slice(1)}`;
  if (digits.startsWith("4") && digits.length === 9) return `+61${digits}`;
  return null;
}

/** Job appointment reminder SMS */
export function jobReminderSmsTemplate(args: {
  clientName: string;
  businessName: string;
  jobTitle: string;
  scheduledDate: string;
  address?: string | null;
}): string {
  const loc = args.address ? ` at ${args.address}` : "";
  return `Hi ${args.clientName}, this is a reminder that ${args.businessName} will be visiting${loc} on ${args.scheduledDate} for: ${args.jobTitle}. Reply STOP to opt out.`;
}

/** Job completion SMS */
export function jobCompletionSmsTemplate(args: {
  clientName: string;
  businessName: string;
  jobTitle: string;
}): string {
  return `Hi ${args.clientName}, your job "${args.jobTitle}" has been completed by ${args.businessName}. Thank you for choosing us!`;
}

/** Invoice sent SMS */
export function invoiceSentSmsTemplate(args: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
}): string {
  return `Hi ${args.clientName}, invoice ${args.invoiceNumber} for ${args.total} from ${args.businessName} is due ${args.dueDate}. Check your email for payment details.`;
}

/** Quote sent SMS */
export function quoteSentSmsTemplate(args: {
  clientName: string;
  businessName: string;
  quoteNumber: string;
  total: string;
}): string {
  return `Hi ${args.clientName}, ${args.businessName} has sent you a quote (${args.quoteNumber}) for ${args.total}. Check your email to review and accept.`;
}
