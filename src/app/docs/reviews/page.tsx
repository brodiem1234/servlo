import Link from "next/link";

export const metadata = { title: "Review Requests — SERVLO Docs" };

export default function ReviewsDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Review Hub</h1>
      <p className="lead">
        Collect more Google reviews automatically and respond to feedback — all from SERVLO.
      </p>

      <h2>Why reviews matter</h2>
      <p>
        For Australian service businesses, Google reviews are the #1 factor in local search
        ranking and the biggest driver of new client trust. Research shows that businesses with
        more than 20 Google reviews receive 3× more enquiries than those with fewer than 5.
      </p>

      <h2>Sending review requests</h2>
      <p>
        Go to <Link href="/dashboard/grow/reviews">GROW → Reviews</Link>. You can send a review
        request to any client who has completed a job. SERVLO sends a personalised email or SMS
        with a direct link to your Google Business Profile review form.
      </p>
      <p>
        Alternatively, enable <strong>Auto-request</strong> to have SERVLO automatically send a
        review request 24 hours after a job is marked as completed.
      </p>

      <h2>Adding your Google Review URL</h2>
      <p>
        To send review requests, add your Google Business Profile review link in{" "}
        <Link href="/dashboard/owner/settings?tab=profile">Settings → Business Profile</Link>.
        To find your review link:
      </p>
      <ol>
        <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">Google Business Profile</a></li>
        <li>Click <strong>Get more reviews</strong></li>
        <li>Copy the short link (e.g. <code>https://g.page/r/…/review</code>)</li>
        <li>Paste it into SERVLO Settings</li>
      </ol>

      <h2>Responding to reviews</h2>
      <p>
        The Review Hub shows all reviews collected via SERVLO. For each review, you can generate
        an AI-assisted response draft tailored to the review&apos;s sentiment and content.
      </p>
      <p>
        Responding to reviews — especially negative ones — signals to Google that you&apos;re an
        engaged business owner and improves your local ranking.
      </p>

      <h2>Satisfaction surveys</h2>
      <p>
        SERVLO also sends a private satisfaction survey via a unique link. The survey collects a
        1–5 star rating and open text feedback. Negative feedback goes to you privately rather
        than becoming a public Google review, letting you address issues before they escalate.
      </p>
    </article>
  );
}
