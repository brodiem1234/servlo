import Link from "next/link";

export const metadata = {
  title: "Quick Start · SERVLO Docs",
};

export default function QuickStartPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Quick Start</h1>
      <p className="lead">Get from sign-up to your first paid invoice in 5 minutes.</p>

      <div className="not-prose mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-800">⏱ Estimated time: 5 minutes</p>
        <p className="mt-1 text-sm text-blue-700">
          Follow these steps in order. Each one unlocks the next.
        </p>
      </div>

      <h2>Step 1: Set up your business profile</h2>
      <p>
        Go to <Link href="/dashboard/owner/settings?tab=profile">Settings → Business Profile</Link> and fill in:
      </p>
      <ul>
        <li>Business name</li>
        <li>ABN (required for GST invoicing)</li>
        <li>Address and phone number</li>
        <li>Logo and brand colour (optional, but looks great on documents)</li>
      </ul>
      <p>
        A complete profile raises your <Link href="/docs/local-seo">Local SEO score</Link> and makes
        your invoices and quotes look professional.
      </p>

      <h2>Step 2: Add your first client</h2>
      <p>
        Go to <Link href="/dashboard/owner/clients">Clients</Link> and click{" "}
        <strong>Add Client</strong>. Fill in:
      </p>
      <ul>
        <li>Full name (required)</li>
        <li>Email address (for invoice delivery)</li>
        <li>Phone number</li>
        <li>Address (pre-fills job location)</li>
      </ul>

      <h2>Step 3: Create a job</h2>
      <p>
        Go to <Link href="/dashboard/owner/jobs">Jobs</Link> and click <strong>New Job</strong>.
        Assign the job to your client, set a scheduled date, and add any relevant notes or address.
      </p>
      <p>
        Jobs move through these statuses as you work:{" "}
        <code>pending → scheduled → in_progress → completed</code>.
      </p>

      <h2>Step 4: Send an invoice</h2>
      <p>
        From the job detail, click <strong>Create Invoice</strong>. SERVLO will pre-fill the client
        and job details. Add your line items (or import from your{" "}
        <Link href="/docs/pricebook">Pricebook</Link>), then click <strong>Send</strong>.
      </p>
      <p>
        The invoice is emailed to your client with a payment link (if you've connected Stripe).
      </p>

      <h2>Step 5: Mark as paid</h2>
      <p>
        When payment is received, go to <Link href="/dashboard/owner/invoices">Invoices</Link> and
        click <strong>Mark Paid</strong> on the invoice. Your revenue metrics update instantly.
      </p>

      <div className="not-prose mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-800">🎉 You did it!</p>
        <p className="mt-1 text-sm text-emerald-700">
          You&apos;ve completed the core workflow. From here, explore{" "}
          <Link href="/docs/quotes" className="font-semibold text-emerald-800 underline">
            Quotes
          </Link>
          ,{" "}
          <Link href="/docs/team" className="font-semibold text-emerald-800 underline">
            Team management
          </Link>
          , and{" "}
          <Link href="/docs/grow-overview" className="font-semibold text-emerald-800 underline">
            GROW
          </Link>{" "}
          to take your business to the next level.
        </p>
      </div>
    </article>
  );
}
