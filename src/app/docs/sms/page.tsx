import Link from "next/link";

export const metadata = { title: "SMS (Twilio) · SERVLO Docs" };

export default function SmsDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>SMS via Twilio</h1>
      <p className="lead">
        Send and receive SMS messages with clients directly from SERVLO.
      </p>

      <h2>Connecting Twilio</h2>
      <p>
        SERVLO uses <a href="https://twilio.com" target="_blank" rel="noopener noreferrer">Twilio</a>{" "}
        for SMS sending and receiving. To enable SMS, you need a Twilio account and the following
        credentials added to your SERVLO environment:
      </p>
      <ul>
        <li><code>TWILIO_ACCOUNT_SID</code></li>
        <li><code>TWILIO_AUTH_TOKEN</code></li>
        <li><code>TWILIO_FROM_NUMBER</code>: your Twilio phone number (must be Australian-capable)</li>
      </ul>
      <p>
        Contact your SERVLO administrator or support to configure these. Self-serve Twilio configuration
        is available in Settings for Business plan subscribers.
      </p>

      <h2>Two-way SMS threads</h2>
      <p>
        Once configured, go to <Link href="/dashboard/owner/comms">Comms → SMS</Link> to view SMS
        conversations with your clients. Messages are organised by client and stored in full for
        your records.
      </p>
      <p>
        Clients reply to your Twilio number and their responses appear in the thread automatically
        (requires Twilio webhook configuration).
      </p>

      <h2>Quick-pay SMS</h2>
      <p>
        From any unpaid invoice, click <strong>Send SMS Reminder</strong> to text your client a
        payment reminder that includes a secure payment link. The link redirects to a payment
        landing page where the client can pay by card.
      </p>

      <h2>Job tracking SMS</h2>
      <p>
        When a job is in progress, you can send your client a live tracking link via SMS. The
        tracking page updates in real-time as the job progresses and shows an estimated arrival
        time.
      </p>

      <h2>Without Twilio</h2>
      <p>
        If Twilio is not configured, SERVLO runs in <em>stub mode</em>. The SMS interface is
        available and you can compose messages, but they will not be delivered. A banner is
        shown to remind you that SMS is not connected.
      </p>
    </article>
  );
}
