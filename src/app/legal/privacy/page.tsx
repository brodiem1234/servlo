import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SERVLO",
  description: "How SERVLO handles your personal information.",
};

const LAST_UPDATED = "15 May 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <p>
        This policy explains how Brodie McDonald (ABN 88 688 301 684), the operator of
        SERVLO, collects, uses, stores, and shares personal information. We
        comply with the Australian Privacy Principles in the Privacy Act 1988
        (Cth).
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Account information.</strong> When you sign up, we collect your
        name, email, business name, ABN, mobile number, the industry you work
        in, and your password (hashed — we can&rsquo;t see it).
      </p>
      <p>
        <strong>Business data you put in.</strong> Client names and contact
        details, job records, quotes, invoices, photos, timesheets, employee
        records, and anything else you create inside SERVLO.
      </p>
      <p>
        <strong>Payment information.</strong> If you subscribe to a paid plan,
        Stripe handles your card details. We never see or store your full card
        number; we just keep a Stripe customer ID and the last 4 digits for
        receipts.
      </p>
      <p>
        <strong>Usage data.</strong> Logs of pages you visit, features you use,
        device type, browser, IP address, and rough location (city). We use
        this to keep SERVLO working and to improve it.
      </p>
      <p>
        <strong>Communications.</strong> If you email us, message us in the
        app, or report a bug, we keep that conversation.
      </p>

      <h2>How we collect it</h2>
      <p>
        Mostly directly from you when you sign up, configure your account, or
        use the platform. Some is collected automatically when you visit the
        site (cookies, server logs). A small amount comes from third parties —
        for example, when you connect Xero or MYOB, we receive data from those
        accounts you authorised.
      </p>

      <h2>Why we collect it</h2>
      <p>We use your personal information to:</p>
      <ul>
        <li>Provide and maintain SERVLO and its features.</li>
        <li>Process payments and send receipts.</li>
        <li>Send service messages (password resets, billing, security alerts).</li>
        <li>Provide support when you ask for help.</li>
        <li>Improve the product and fix bugs.</li>
        <li>
          Send marketing emails, but only if you&rsquo;ve opted in. You can
          unsubscribe anytime.
        </li>
        <li>Meet our legal and tax obligations.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We don&rsquo;t sell your personal information. We share it only with
        service providers we need to run SERVLO:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database and authentication. Hosted in
          Sydney (ap-southeast-2).
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and edge network.
        </li>
        <li>
          <strong>Stripe</strong> — subscription billing. Stripe is PCI-DSS
          Level 1 compliant.
        </li>
        <li>
          <strong>Resend</strong> — transactional email (signup confirmations,
          password resets, billing notices).
        </li>
        <li>
          <strong>Twilio</strong> — SMS notifications, if you enable them.
        </li>
        <li>
          <strong>Sentry</strong> — error tracking. Helps us spot and fix bugs.
        </li>
        <li>
          Optional integrations you connect yourself (Xero, MYOB, etc.) — only
          the data needed to make that integration work.
        </li>
      </ul>
      <p>
        Each of those providers is bound by their own privacy commitments and
        we&rsquo;ve picked them because they meet a reasonable standard.
      </p>
      <p>
        We may also disclose information if we&rsquo;re required to by law,
        court order, or a regulator.
      </p>

      <h2>Where your data lives</h2>
      <p>
        Your business data is stored in Supabase&rsquo;s Sydney region. Some
        service providers process limited data outside Australia (Stripe in
        the US, Resend and Sentry in the US/EU). When personal information is
        sent overseas, we take reasonable steps to make sure it&rsquo;s
        handled in line with the Australian Privacy Principles.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account is active. If you cancel, we keep
        it for 30 days so you can come back if you change your mind, then we
        permanently delete it. Some records (invoices, payments) we keep
        longer to meet ATO record-keeping requirements (typically 5 years).
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard security measures: TLS in transit, encrypted
        backups, hashed passwords, row-level security on the database, and
        access controls based on role. No system is 100% secure, but we work
        hard to make ours close. If we ever have a data breach that might
        cause serious harm, we&rsquo;ll notify you and the OAIC as required
        under the Notifiable Data Breaches scheme.
      </p>

      <h2>Your rights</h2>
      <p>You can:</p>
      <ul>
        <li>
          Ask what personal information we hold about you and get a copy of it.
        </li>
        <li>Correct anything that&rsquo;s wrong.</li>
        <li>
          Ask us to delete your account and the personal information we hold.
        </li>
        <li>Unsubscribe from marketing emails at any time.</li>
        <li>
          Complain to the Office of the Australian Information Commissioner
          (OAIC) if you think we&rsquo;ve mishandled your information.
        </li>
      </ul>
      <p>
        To do any of this, email{" "}
        <a href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>. We&rsquo;ll
        respond within 30 days.
      </p>

      <h2>Cookies</h2>
      <p>
        We use cookies for essential functions (keeping you signed in,
        remembering your preferences) and a small amount of analytics so we
        know which features are useful. We don&rsquo;t use third-party
        advertising cookies. You can disable cookies in your browser, but some
        parts of SERVLO may stop working.
      </p>

      <h2>Children</h2>
      <p>
        SERVLO is built for adults running businesses. We don&rsquo;t knowingly
        collect personal information from anyone under 18.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We&rsquo;ll update this policy when our practices change. Material
        changes will be emailed to account owners. The latest version always
        lives at this URL.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests:{" "}
        <a href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>.
      </p>

      <p className="mt-12 rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200/80">
        <strong>Draft.</strong> This document is a working draft pending
        review by Brodie McDonald&rsquo;s lawyer. Replace bracketed
        placeholders before publishing.
      </p>
    </>
  );
}
