import Link from "next/link";

export const metadata = { title: "Client Portal — SERVLO Docs" };

export default function ClientPortalDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Client Portal</h1>
      <p className="lead">
        Give every client a personalised self-service portal — no login required.
      </p>

      <h2>What the portal shows</h2>
      <p>Each client portal displays, branded with your business colours and logo:</p>
      <ul>
        <li>Active jobs with a progress bar (Booked → Scheduled → In Progress → Completed)</li>
        <li>Pending quotes with Accept / Decline (or View &amp; Sign if the quote has a share link)</li>
        <li>Invoices with due dates and Pay Now button (if Stripe is connected)</li>
        <li>Completed jobs with a Google review link</li>
        <li>A service request form to submit new enquiries</li>
        <li>Contact details (phone &amp; email) for your business</li>
      </ul>

      <h2>Sharing the portal link</h2>
      <p>
        Each client has a unique portal token. Go to{" "}
        <Link href="/dashboard/owner/clients">Clients</Link>, open a client record, and copy the{" "}
        <strong>Portal Link</strong>. Send this link to your client — they don&apos;t need an account
        to view it.
      </p>
      <p>
        The portal URL format is: <code>https://servlo.com.au/portal/[token]</code>
      </p>

      <h2>Token security</h2>
      <p>
        Portal tokens are 40-character random hex strings. They cannot be guessed by brute force.
        If a client should no longer have access (e.g. relationship ended), go to their client
        record and regenerate the token — the old link will stop working immediately.
      </p>

      <h2>Magic link login (authenticated portal)</h2>
      <p>
        For clients who prefer a logged-in experience with full account history, they can use the{" "}
        <Link href="/portal/login">magic link login</Link> page. They enter their email address
        and receive a secure one-click login link. No password required.
      </p>
      <p>
        The authenticated portal (<Link href="/dashboard/client">/dashboard/client</Link>) shows
        all jobs, quotes, and invoices across all businesses that have linked their email address
        as a client.
      </p>

      <h2>Service requests</h2>
      <p>
        Clients can submit new service requests from the portal. These are stored in your
        system as <strong>client enquiries</strong> and will appear in your inbox as a task.
        The request includes service type, description, preferred date, and urgency level.
      </p>

      <h2>Branding</h2>
      <p>
        The portal header shows your business name and uses your brand accent colour for buttons
        and progress bars. Add your logo and colour in{" "}
        <Link href="/dashboard/owner/settings?tab=appearance">Settings → Appearance</Link>.
      </p>
    </article>
  );
}
