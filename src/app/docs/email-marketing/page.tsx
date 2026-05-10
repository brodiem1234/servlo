import Link from "next/link";

export const metadata = { title: "Email Marketing — SERVLO Docs" };

export default function EmailMarketingDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Email Marketing</h1>
      <p className="lead">
        Send campaigns to your client list to drive repeat business, announce new services, and
        re-engage inactive clients.
      </p>

      <h2>Creating a campaign</h2>
      <p>
        Go to <Link href="/dashboard/grow/email">GROW → Email</Link> and click{" "}
        <strong>New Campaign</strong>. Choose a template or start from scratch:
      </p>
      <ul>
        <li><strong>Seasonal promotion</strong> — seasonal discounts or reminders</li>
        <li><strong>Re-engagement</strong> — reach out to clients you haven&apos;t heard from</li>
        <li><strong>New service announcement</strong> — tell clients about a new offering</li>
        <li><strong>Review request</strong> — remind clients to leave a review</li>
      </ul>

      <h2>Audience segmentation</h2>
      <p>Choose who to send your campaign to:</p>
      <ul>
        <li><strong>All clients</strong> — every active client with an email address</li>
        <li><strong>Inactive clients</strong> — clients with no jobs in the past 90 days</li>
        <li><strong>By industry / tag</strong> — clients tagged with a specific service category</li>
      </ul>

      <h2>Personalisation</h2>
      <p>
        Use merge tags in your email body to personalise each message:
      </p>
      <ul>
        <li><code>{`{{first_name}}`}</code> — client&apos;s first name</li>
        <li><code>{`{{business_name}}`}</code> — your business name</li>
        <li><code>{`{{last_job_date}}`}</code> — date of their most recent job</li>
      </ul>

      <h2>Sending and tracking</h2>
      <p>
        Preview your campaign, then click <strong>Send Campaign</strong>. SERVLO delivers the
        email to each recipient via Resend. Campaign statistics (opens, clicks) are tracked if
        you have a Resend Pro plan with analytics enabled.
      </p>

      <h2>Unsubscribes</h2>
      <p>
        All campaign emails include an unsubscribe link as required by Australian Spam Act 2003.
        Clients who unsubscribe are automatically excluded from future campaigns.
      </p>

      <h2>Best practices</h2>
      <ul>
        <li>Keep subject lines under 50 characters</li>
        <li>Send on Tuesday–Thursday mornings for highest open rates</li>
        <li>Include one clear call-to-action per email</li>
        <li>Don&apos;t send more than 1–2 campaigns per month to avoid unsubscribes</li>
      </ul>
    </article>
  );
}
