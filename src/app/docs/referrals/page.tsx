import Link from "next/link";

export const metadata = { title: "Referral Program — SERVLO Docs" };

export default function ReferralsDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Referral Program</h1>
      <p className="lead">
        Turn your existing clients into a lead generation engine with a personalised referral link.
      </p>

      <h2>How it works</h2>
      <p>
        SERVLO generates a unique referral link for your business. When someone visits your referral
        link and signs up or submits an enquiry, that referral is tracked back to you.
      </p>

      <h2>Your referral link</h2>
      <p>
        Your referral link appears in the <strong>Referral Widget</strong> on your dashboard.
        The format is: <code>https://servlo.com.au?ref=YOURCODE</code>
      </p>
      <p>
        Share your referral link with:
      </p>
      <ul>
        <li>Existing clients (by SMS or email)</li>
        <li>Your website (add a "Recommended by" badge)</li>
        <li>Business cards and flyers</li>
        <li>Social media bio links</li>
      </ul>

      <h2>QR Code</h2>
      <p>
        Go to <Link href="/dashboard/grow/referrals">GROW → Referrals</Link> to download your
        referral QR code. Print it on:
      </p>
      <ul>
        <li>Your invoice footer ("Refer a friend and save")</li>
        <li>Your company vehicle signage</li>
        <li>Flyers left at job sites</li>
        <li>A sign in your reception or workshop</li>
      </ul>

      <h2>Tracking referrals</h2>
      <p>
        The Referrals page shows how many visits and conversions your referral link has generated.
        Each conversion is logged with the date and the referring source.
      </p>

      <h2>Referral rewards</h2>
      <p>
        SERVLO tracks referrals but does not automatically manage rewards. We recommend manually
        rewarding clients who refer new business with a discount on their next invoice or a gift
        card. Record these discounts as line item credits on the invoice.
      </p>
    </article>
  );
}
