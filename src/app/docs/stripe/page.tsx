import Link from "next/link";

export const metadata = { title: "Stripe Payments · SERVLO Docs" };

export default function StripeDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Stripe Payments</h1>
      <p className="lead">
        Connect Stripe to accept online payments via invoices and the client portal.
      </p>

      <h2>Connecting Stripe</h2>
      <p>
        Go to{" "}
        <Link href="/dashboard/owner/settings?tab=integrations">Settings → Integrations</Link>{" "}
        and click <strong>Connect Stripe</strong>. You&apos;ll be redirected to Stripe to authorise
        the connection. Once connected, SERVLO can create payment links and charge cards.
      </p>

      <h2>Payment links on invoices</h2>
      <p>
        After connecting Stripe, open any unpaid invoice and click{" "}
        <strong>Generate Payment Link</strong>. Stripe creates a hosted payment page for that
        invoice amount. SERVLO stores the link and displays it on the invoice email and in the
        client portal.
      </p>
      <p>
        When the client pays via the Stripe link, the payment is recorded and the invoice is
        automatically marked as paid.
      </p>

      <h2>SERVLO subscription billing</h2>
      <p>
        Your SERVLO subscription is also managed via Stripe. You can view and update your
        billing details, download invoices, and change your plan in{" "}
        <Link href="/dashboard/owner/settings?tab=billing">Settings → Billing</Link>.
      </p>

      <h2>Refunds</h2>
      <p>
        Refunds are processed directly in your{" "}
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
          Stripe Dashboard
        </a>
        . Once a refund is processed in Stripe, update the invoice status manually in SERVLO.
      </p>

      <h2>Stripe fees</h2>
      <p>
        Stripe charges a per-transaction fee for card payments (varies by country and card type).
        These fees are charged by Stripe directly. SERVLO does not add any additional payment
        processing fees.
      </p>

      <h2>Supported payment methods</h2>
      <p>
        Via Stripe payment links, your clients can pay with:
      </p>
      <ul>
        <li>Visa, Mastercard, American Express</li>
        <li>Apple Pay and Google Pay</li>
        <li>BECS Direct Debit (Australian bank transfer)</li>
      </ul>
    </article>
  );
}
