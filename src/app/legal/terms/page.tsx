import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | SERVLO",
  description: "The terms that govern your use of SERVLO.",
};

const LAST_UPDATED = "15 May 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <p>
        These terms govern your use of SERVLO (the platform, the website, the
        mobile app, anything we publish under the SERVLO name). SERVLO is
        operated by Brodie McDonald, ABN 88 688 301 684, an Australian business
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
      </p>
      <p>
        When you sign up for an account, or just use the public parts of the
        site, you&rsquo;re agreeing to these terms. If you don&rsquo;t agree,
        don&rsquo;t use SERVLO.
      </p>

      <h2>1. What SERVLO is</h2>
      <p>
        SERVLO is software-as-a-service for trade businesses. We help you manage
        jobs, clients, quotes, invoices, employees, and the rest of the
        day-to-day. We don&rsquo;t do the work for you. We don&rsquo;t take
        payments on your behalf unless you explicitly connect a payment
        processor like Stripe.
      </p>

      <h2>2. Your account</h2>
      <p>
        You need to be at least 18 and running (or working at) a real business
        to sign up. You&rsquo;re responsible for keeping your password secure.
        If something dodgy happens on your account, tell us straight away at
        hello@servlo.com.au.
      </p>
      <p>
        You can have multiple users on one account (owners, employees,
        contractors). The account owner is on the hook for what those users do
        on SERVLO.
      </p>

      <h2>3. Plans, trials, and payment</h2>
      <p>
        SERVLO is a subscription. You pick a plan, you pay monthly or annually.
        We may offer a free trial when you first sign up — if we do, the trial
        length and terms will be shown when you sign up. After the trial ends,
        your subscription starts and we charge the card on file.
      </p>
      <p>
        Prices are in Australian dollars and include GST where applicable. We
        can change pricing with 30 days&rsquo; notice; if you don&rsquo;t agree,
        you can cancel.
      </p>
      <p>
        Subscriptions auto-renew. You can cancel anytime from your billing
        settings. Cancellation takes effect at the end of the current billing
        period.
      </p>

      <h2>4. Refunds</h2>
      <p>
        Refunds are governed by our{" "}
        <a href="/legal/refund">Refund Policy</a>. Nothing in these terms
        excludes the rights you have under the Australian Consumer Law.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use SERVLO for anything illegal or to do harm.</li>
        <li>
          Try to break, reverse-engineer, or get unauthorised access to the
          platform or anyone else&rsquo;s account.
        </li>
        <li>
          Upload malware, send spam through the platform, or scrape it for
          competitive purposes.
        </li>
        <li>
          Resell or sub-licence SERVLO to third parties without our written
          okay.
        </li>
        <li>
          Use SERVLO in a way that breaks Australian Consumer Law, the Privacy
          Act 1988, the Spam Act 2003, or any other applicable law.
        </li>
      </ul>

      <h2>6. Your data</h2>
      <p>
        You own your data. We process it on your behalf so SERVLO can do its
        job. How we handle personal information is covered in our{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>
      <p>
        You can export your data anytime from your account settings. If you
        cancel, you have 30 days to export before we permanently delete it.
      </p>

      <h2>7. Our IP</h2>
      <p>
        SERVLO, the brand, the code, the design — that&rsquo;s ours. You get a
        non-exclusive, non-transferable licence to use SERVLO for your business
        while your subscription is active. You don&rsquo;t get any other rights
        in our IP.
      </p>

      <h2>8. Service availability</h2>
      <p>
        We aim for 99.9% uptime but we don&rsquo;t guarantee SERVLO will always
        be available. We&rsquo;ll do scheduled maintenance during off-peak
        hours where possible and we&rsquo;ll tell you in advance.
      </p>
      <p>
        Status updates are posted at{" "}
        <a href="/status">/status</a>.
      </p>

      <h2>9. Liability</h2>
      <p>
        To the extent allowed by law, our liability to you for any claim
        connected to SERVLO is capped at the fees you paid us in the 12 months
        before the claim arose. We&rsquo;re not liable for indirect, special,
        or consequential losses (lost profits, lost data that wasn&rsquo;t our
        fault, lost business opportunities).
      </p>
      <p>
        Nothing in these terms excludes the consumer guarantees or other rights
        you have under the Australian Consumer Law that can&rsquo;t be excluded.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        We can suspend or terminate your account if you breach these terms,
        don&rsquo;t pay, or do something that puts SERVLO or other users at
        risk. We&rsquo;ll tell you why and give you a chance to fix it where
        practical.
      </p>
      <p>You can close your account anytime from settings.</p>

      <h2>11. Changes to these terms</h2>
      <p>
        We&rsquo;ll update these terms from time to time. If a change
        materially affects you, we&rsquo;ll email you and give you 30
        days&rsquo; notice. Continuing to use SERVLO after that means you
        accept the new terms.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of South Australia, Australia. Any dispute
        goes to the courts of South Australia.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions, complaints, suggestions: hello@servlo.com.au.
      </p>

      <p className="mt-12 rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200/80">
        <strong>Draft.</strong> This document is a working draft pending review
        by Brodie McDonald&rsquo;s lawyer. Replace bracketed placeholders
        before publishing.
      </p>
    </>
  );
}
