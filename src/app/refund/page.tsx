import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Refund Policy | SERVLO",
  description: "How refunds work at SERVLO.",
};

const LAST_UPDATED = "15 May 2026";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-2 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-white prose-a:font-bold prose-a:underline hover:prose-a:text-neutral-300 prose-strong:text-white">
          <h1>Refund Policy</h1>
          <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

          <p>
            SERVLO is a subscription product. This page explains when refunds
            apply and how to request one. Nothing here cuts into the rights you
            have under the Australian Consumer Law (ACL) — those still apply,
            and in any conflict, the ACL wins.
          </p>

          <h2>The free trial</h2>
          <p>
            New accounts get a free trial. You won&rsquo;t be charged during the
            trial. If you cancel before it ends, you owe nothing and there&rsquo;s
            nothing to refund. Cancel from your billing settings or email{" "}
            <a href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>.
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
            Plans bought under a founding member or early-bird offer are
            non-refundable after the first 30 days. The discount only applies
            for as long as you keep your subscription active and continuously
            paid. Cancel and the founding rate is gone.
          </p>

          <h2>If something&rsquo;s broken</h2>
          <p>
            Under the Australian Consumer Law, you&rsquo;re entitled to a refund
            or replacement if a product has a major problem — for SERVLO, that
            means the platform doesn&rsquo;t do something fundamental we said it
            would do, or it&rsquo;s unsafe. If that happens, get in touch and
            we&rsquo;ll work it out fairly.
          </p>

          <h2>How to request a refund</h2>
          <p>
            Email <a href="mailto:hello@servlo.com.au">hello@servlo.com.au</a> with:
          </p>
          <ul>
            <li>The email on your account.</li>
            <li>The Stripe invoice number or charge date.</li>
            <li>Why you&rsquo;re asking for a refund.</li>
          </ul>
          <p>
            We&rsquo;ll respond within 5 business days. Approved refunds go back
            to the original payment method within 5–10 business days, depending
            on your bank.
          </p>

          <h2>Chargebacks</h2>
          <p>
            If you have a problem, please email us first. Going straight to a
            chargeback without contacting us costs us a fee and may result in
            your account being suspended.
          </p>

          <h2>Contact</h2>
          <p>
            Email <a href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>.
            Reach out and we&rsquo;ll get it sorted.
          </p>
        </article>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <p>
            SERVLO is operated by Brodie McDonald, ABN 88 688 301 684.
          </p>
        </footer>
      </main>
    </div>
  );
}
