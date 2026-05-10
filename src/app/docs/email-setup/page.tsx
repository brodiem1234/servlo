import Link from "next/link";

export const metadata = { title: "Email Setup (Resend) — SERVLO Docs" };

export default function EmailSetupDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Transactional Email (Resend)</h1>
      <p className="lead">
        SERVLO uses Resend to deliver invoices, reminders, and notifications to your clients.
      </p>

      <h2>How email works in SERVLO</h2>
      <p>
        When you send an invoice, quote, or reminder from SERVLO, the email is delivered via{" "}
        <a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a> — a
        developer-focused email delivery service with high deliverability.
      </p>
      <p>
        Emails are sent <em>from</em> your configured <code>RESEND_FROM_EMAIL</code> address
        (typically <code>noreply@yourdomain.com</code> or <code>invoices@yourdomain.com</code>).
      </p>

      <h2>Configuration</h2>
      <p>Two environment variables are required:</p>
      <ul>
        <li>
          <code>RESEND_API_KEY</code> — your API key from the{" "}
          <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
            Resend dashboard
          </a>
        </li>
        <li>
          <code>RESEND_FROM_EMAIL</code> — the verified sender address (must be verified in
          Resend)
        </li>
      </ul>

      <h2>Custom domain</h2>
      <p>
        For best deliverability, verify your own domain in Resend and send from{" "}
        <code>invoices@yourbusiness.com.au</code>. This prevents your emails from landing in spam.
      </p>
      <p>
        To verify a domain in Resend, add the required DNS records (SPF, DKIM, DMARC) to your
        domain registrar. Resend provides step-by-step instructions in their dashboard.
      </p>

      <h2>Emails sent by SERVLO</h2>
      <ul>
        <li>Invoice delivery with PDF attachment</li>
        <li>Invoice overdue reminders</li>
        <li>Quote delivery</li>
        <li>Job completion summary (sent to client after job marked complete)</li>
        <li>Review request (after job completion)</li>
        <li>Team member invitation</li>
        <li>New client portal link</li>
        <li>Welcome email (on signup)</li>
      </ul>

      <h2>Without Resend</h2>
      <p>
        If <code>RESEND_API_KEY</code> is not set, SERVLO falls back to logging email content
        to the console. No emails are delivered to clients. This is the default for local
        development.
      </p>
    </article>
  );
}
