import Link from "next/link";

export const metadata = { title: "Local SEO — SERVLO Docs" };

export default function LocalSeoDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Local SEO</h1>
      <p className="lead">
        Improve your Google ranking in your local area with SERVLO&apos;s SEO tools.
      </p>

      <h2>Your SEO Score</h2>
      <p>
        Go to <Link href="/dashboard/grow/seo">GROW → Local SEO</Link> to see your SEO score
        out of 100. The score is calculated from real data in your SERVLO account:
      </p>
      <ul>
        <li>Business name set: +10</li>
        <li>Phone number: +10</li>
        <li>Address and suburb: +10</li>
        <li>ABN: +5</li>
        <li>Email address: +5</li>
        <li>At least 1 review collected: +15</li>
        <li>5 or more reviews: +10 (bonus)</li>
        <li>More than 10 active clients: +5</li>
        <li>Base score: 30</li>
      </ul>

      <h2>Keywords</h2>
      <p>
        The Keywords tab shows recommended search terms based on your industry and location.
        These are the phrases your potential customers are searching for. Use them in:
      </p>
      <ul>
        <li>Your Google Business Profile description</li>
        <li>Your website homepage and service pages</li>
        <li>Your SERVLO business bio</li>
      </ul>

      <h2>Local Citations (Directories)</h2>
      <p>
        A <em>citation</em> is any online mention of your business name, address, and phone number
        (NAP). Consistent citations across directories improve your local Google ranking.
      </p>
      <p>
        SERVLO lists the 8 most important Australian business directories. For each one, click the
        link to visit the directory and list your business, then click{" "}
        <strong>Mark as Listed</strong> to track your progress. Your citation coverage percentage
        is shown on the Overview tab.
      </p>

      <h3>Key Australian directories</h3>
      <ul>
        <li>Google Business Profile (most important)</li>
        <li>True Local</li>
        <li>Yellow Pages</li>
        <li>Yelp Australia</li>
        <li>Hipages</li>
        <li>ServiceSeeking</li>
        <li>Oneflare</li>
        <li>Localsearch</li>
      </ul>

      <h2>Action Plan</h2>
      <p>
        The Action Plan tab shows a personalised checklist of SEO improvements based on your
        current data gaps. Items are dynamically generated — for example, if you have fewer than
        5 reviews, the action plan prompts you to{" "}
        <Link href="/dashboard/grow/reviews">request more reviews</Link>.
      </p>

      <h2>NAP Consistency</h2>
      <p>
        NAP stands for Name, Address, Phone. Google uses NAP consistency across the web as a
        ranking signal. Ensure your business name, address, and phone number appear identically
        on every directory listing — no abbreviations, no variations.
      </p>
      <p>
        Your canonical NAP is shown on the Directories tab. This is pulled directly from your
        SERVLO business profile.
      </p>
    </article>
  );
}
