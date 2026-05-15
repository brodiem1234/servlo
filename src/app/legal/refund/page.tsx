import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | SERVLO",
  description: "How refunds work at SERVLO.",
};

const LAST_UPDATED = "15 May 2026";

export default function RefundPage() {
  return (
    <>
      <h1>Refund Policy</h1>
      <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <p>
        SERVLO is a subscription product. This page explains when refunds
        apply and how to request one. Nothing here cuts into the rights you
        have under the Australian Consumer Law (ACL) — those still apply, and
        in any conflict, the ACL wins.
      </p>

      <h2>The free trial</h2>
      <p>
        New accounts get a free trial. You won&rsquo;t be charged during the
        trial. If you cancel before it ends, you owe nothing and there&rsquo;s
        nothing to refund. Cancel from your billing settings or email{" "}
        <a href="mailto:[CONTACT_EMAIL]">[CONTACT_EMAIL]</a>.
      </p>

      <h2>Monthly subscriptions</h2>
      <p>
        If you cancel a monthly plan, your subscription stays active until the
        end of the current billing period and then stops. We don&rsquo;t pro-rate
        refunds for partial months. If you forgot to cancel and notice within
        7 days of being charged, email us and we&rsquo;ll usually sort it out
        as a goodwill refund.
      </p>

      <h2>Annual subscriptions</h2>
      <p>
        If you cancel an annual plan within 30 days of the start of your billing
        year, we&rsquo;ll refund you in full. After 30 days, we don&rsquo;t
        refund the unused portion, but your subscription stays active until
        the end of the year you paid for.
      </p>

      <h2>Founding member offers</h2>
      <p>
        Plans bought under a founding member or early-bird offer are non-refundable
        after the first 30 days. The discount only applies for as long as you
        keep your subscription active and continuously paid. Cancel and the
        founding rate is gone.
      </p>

      <h2>If something&rsquo;s broken</h2>
      <p>
        Under the Australian Consumer Law, you&rsquo;re entitled to a refund or
        replacement if a product has a major problem — for SERVLO, that means
        the platform doesn&rsquo;t do something fundamental we said it would
        do, or it&rsquo;s unsafe. If that happens, get in touch and we&rsquo;ll
        work it out fairly.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <a href="mailto:[CONTACT_EMAIL]">[CONTACT_EMAIL]</a> with:
      </p>
      <ul>
        <li>The email on your account.</li>
        <li>The Stripe invoice number or charge date.</li>
        <li>Why you&rsquo;re asking for a refund.</li>
      </ul>
      <p>
        We&rsquo;ll respond within 5 business days. Approved refunds go back
        to the original payment method within 5–10 business days, depending on
        your bank.
      </p>

      <h2>Chargebacks</h2>
      <p>
        If you have a problem, please email us first. Going straight to a
        chargeback without contacting us costs us a fee and may result in your
        account being suspended.
      </p>

      <h2>Contact</h2>
      <p>
        Email <a href="mailto:[CONTACT_EMAIL]">[CONTACT_EMAIL]</a>. Reach out
        and we&rsquo;ll get it sorted.
      </p>

      <p className="mt-12 rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200/80">
        <strong>Draft.</strong> This document is a working draft pending review
        by [BUSINESS NAME]&rsquo;s lawyer. Replace bracketed placeholders
        before publishing.
      </p>
    </>
  );
}
