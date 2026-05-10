import Link from "next/link";

export const metadata = { title: "Invoices & Payments — SERVLO Docs" };

export default function InvoicesDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Invoices & Payments</h1>
      <p className="lead">
        Create professional invoices, track payments, and chase overdue amounts — all in one place.
      </p>

      <h2>Creating an invoice</h2>
      <p>
        Go to <Link href="/dashboard/owner/invoices">Invoices</Link> and click{" "}
        <strong>New Invoice</strong>, or create one directly from a job using the{" "}
        <em>Create Invoice</em> button on the job detail page.
      </p>
      <p>
        Add line items manually, or click <strong>Import from Pricebook</strong> to pull in your
        saved rates and products.
      </p>

      <h2>GST</h2>
      <p>
        If your ABN is set in <Link href="/dashboard/owner/settings?tab=profile">Settings</Link>,
        SERVLO calculates 10% GST on each line item that has GST enabled. The invoice total shows
        the GST-inclusive amount and a separate GST breakdown.
      </p>

      <h2>Invoice statuses</h2>
      <ul>
        <li><strong>Draft</strong> — not yet sent</li>
        <li><strong>Sent</strong> — emailed to client, awaiting payment</li>
        <li><strong>Paid</strong> — payment confirmed</li>
        <li><strong>Overdue</strong> — past due date, unpaid</li>
        <li><strong>Cancelled</strong> — voided</li>
      </ul>

      <h2>Sending a reminder</h2>
      <p>
        Overdue invoices appear on the owner dashboard with a <strong>Send Reminder</strong> button.
        This emails the client a payment reminder using your business details and the invoice total.
        SERVLO records the date the reminder was sent.
      </p>

      <h2>Partial payments</h2>
      <p>
        Click <strong>Part Pay</strong> on any unpaid invoice to record a partial payment. Enter
        the amount, payment method, reference number, and date. SERVLO tracks the running balance
        and automatically marks the invoice as paid when the full amount is received.
      </p>

      <h2>Online payments (Stripe)</h2>
      <p>
        Connect Stripe in <Link href="/dashboard/owner/settings?tab=integrations">Settings → Integrations</Link>{" "}
        to generate payment links. Add the Stripe payment link to an invoice to let your client pay
        online by card. The link also appears in the{" "}
        <Link href="/docs/client-portal">client portal</Link>.
      </p>

      <h2>Payment terms</h2>
      <p>
        Set default payment terms (e.g. 14 days) in Settings. These pre-fill the due date when
        creating a new invoice. You can override the due date per invoice.
      </p>

      <h2>Buckets & filtering</h2>
      <p>
        The Invoices page has four quick-filter buckets: <strong>All</strong>,{" "}
        <strong>Unpaid</strong>, <strong>Overdue</strong>, and <strong>Paid</strong>. Use the
        search bar to filter by client name or invoice number.
      </p>
    </article>
  );
}
