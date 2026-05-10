import Link from "next/link";

export const metadata = { title: "GROW Overview — SERVLO Docs" };

export default function GrowOverviewPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>GROW — Marketing Tools</h1>
      <p className="lead">
        GROW is SERVLO&apos;s marketing suite, designed to help service businesses attract more customers
        and grow their revenue without a marketing agency.
      </p>

      <h2>What&apos;s in GROW?</h2>

      <h3>📍 Local SEO</h3>
      <p>
        Track your SEO score, get keyword recommendations, and manage your directory listings
        (citations) to improve your Google ranking for local searches.{" "}
        <Link href="/docs/local-seo">Read the SEO guide →</Link>
      </p>

      <h3>⭐ Review Hub</h3>
      <p>
        Send automated review request messages to clients after a job is completed. Monitor
        incoming reviews and respond with AI-assisted reply suggestions. Filter and analyse
        your review sentiment to improve service quality.
      </p>

      <h3>📧 Email Marketing</h3>
      <p>
        Create and send email campaigns to your client list. Choose from templates (seasonal
        promotions, re-engagement, new services) or write your own. Track open rates and
        click-throughs.
      </p>

      <h3>🔗 Referral Program</h3>
      <p>
        Generate a unique referral link with a QR code. Share it with existing clients to earn
        new leads. Track referral conversions and see your referral URL on the dashboard widget.
      </p>

      <h3>📱 Social Calendar</h3>
      <p>
        Plan and schedule social media posts across Facebook, Instagram, and Google Business
        Profile. The content calendar gives you a visual overview of upcoming posts. Use the
        AI content assistant to generate post ideas based on your industry.
      </p>

      <h3>📊 Ad Studio</h3>
      <p>
        Create Google Ads and Meta (Facebook/Instagram) campaigns in a 7-step guided wizard.
        Set your budget, target audience, and geographic area. Ad Studio generates copy and
        creative brief based on your business profile.
      </p>

      <h3>🎨 Brand Kit</h3>
      <p>
        Manage your brand assets — logo, colour palette, typography, and tone of voice. Brand
        settings flow through to invoices, quotes, email templates, and the client portal.
      </p>

      <h3>🤖 AI Marketing Coach</h3>
      <p>
        An AI-powered chat assistant trained on service business marketing. Ask it for campaign
        ideas, copywriting help, pricing strategy, or how to respond to a negative review.
      </p>

      <h2>Getting started with GROW</h2>
      <ol>
        <li>
          Start with your <Link href="/docs/local-seo">Local SEO score</Link> — it&apos;s free and
          instant. Getting to 80+ is the single highest-leverage action for a new service business.
        </li>
        <li>
          Enable <strong>Review Requests</strong> so every completed job automatically asks for
          a Google review. Reviews compound over time.
        </li>
        <li>
          Set up your <strong>Referral Program</strong> and add the QR code to your invoices
          and business cards.
        </li>
        <li>
          Once you have 50+ clients, run your first <strong>Email Campaign</strong> with a
          seasonal promotion.
        </li>
      </ol>
    </article>
  );
}
