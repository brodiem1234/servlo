import Link from "next/link";

export const metadata = {
  title: "SERVLO Documentation",
  description: "Everything you need to run your service business with SERVLO.",
};

const PRODUCT_CARDS = [
  {
    emoji: "🔧",
    name: "CORE",
    tagline: "Jobs, clients, invoices, quotes, team.",
    href: "/docs/jobs",
    color: "#3B82F6",
  },
  {
    emoji: "📈",
    name: "GROW",
    tagline: "SEO, reviews, email, referrals.",
    href: "/docs/grow-overview",
    color: "#8B5CF6",
  },
  {
    emoji: "🎯",
    name: "LEADS",
    tagline: "Marketplace leads & pipeline.",
    href: "/docs/clients",
    color: "#F59E0B",
  },
  {
    emoji: "🌐",
    name: "Client Portal",
    tagline: "Self-service for your clients.",
    href: "/docs/client-portal",
    color: "#14B8A6",
  },
];

export default function DocsIndex() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="not-prose mb-10">
        <h1 className="text-4xl font-black text-white">SERVLO Documentation</h1>
        <p className="mt-3 text-lg text-neutral-400">
          Everything you need to run your service business — jobs, invoicing, marketing, and more.
        </p>
      </div>

      {/* Quick links */}
      <div className="not-prose grid grid-cols-2 gap-4 mb-12 sm:grid-cols-4">
        {PRODUCT_CARDS.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-white/20"
          >
            <span className="text-2xl">{card.emoji}</span>
            <span className="font-bold text-white">{card.name}</span>
            <span className="text-xs text-neutral-400">{card.tagline}</span>
          </Link>
        ))}
      </div>

      <h2>What is SERVLO?</h2>
      <p>
        SERVLO is a business management platform for Australian service businesses — tradies, cleaners,
        event companies, health providers, and field service operators. It combines job management, invoicing,
        client communications, marketing, and lead generation into a single, mobile-friendly workspace.
      </p>

      <h2>Getting Started</h2>
      <ol>
        <li>
          <strong>Sign up</strong> at <a href="https://servlo.app">servlo.app</a> and choose your
          industry during onboarding. SERVLO will recommend the right features for your business type.
        </li>
        <li>
          <strong>Set up your business profile</strong> — go to{" "}
          <Link href="/dashboard/owner/settings?tab=profile">Settings → Business Profile</Link> and add your
          ABN, address, and contact details. This unlocks your SEO score and populates your documents.
        </li>
        <li>
          <strong>Add clients and create your first job</strong> — follow the{" "}
          <Link href="/docs/onboarding">onboarding checklist</Link> that appears on your dashboard.
        </li>
        <li>
          <strong>Send your first invoice</strong> — once a job is complete, create an invoice directly from
          the job detail page. Add your Stripe payment link for online payments.
        </li>
      </ol>

      <h2>Core Concepts</h2>

      <h3>Workspaces & Features</h3>
      <p>
        SERVLO uses a <em>feature flag</em> system to show only the tools relevant to your business.
        When you sign up, features are enabled based on your industry. You can toggle features on or off
        in <Link href="/dashboard/owner/settings?tab=features">Settings → Features</Link>.
      </p>

      <h3>Demo Data</h3>
      <p>
        New accounts are seeded with demo data (jobs, clients, invoices) so you can explore the interface
        before entering real data. Demo records are clearly labelled with a{" "}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white not-italic">DEMO</span>{" "}
        badge and are excluded from all financial totals and reports.
      </p>

      <h3>Australian Business Number (ABN)</h3>
      <p>
        Add your ABN in Settings to unlock GST calculations on invoices and quotes. All amounts are
        displayed in Australian dollars (AUD). GST is calculated at 10%.
      </p>

      <h2>Quick Start Guides</h2>
      <ul>
        <li><Link href="/docs/quick-start">Quick Start — 5 minutes to first invoice</Link></li>
        <li><Link href="/docs/jobs">Managing Jobs</Link></li>
        <li><Link href="/docs/invoices">Sending Invoices</Link></li>
        <li><Link href="/docs/client-portal">Setting up the Client Portal</Link></li>
        <li><Link href="/docs/local-seo">Improving your Local SEO</Link></li>
      </ul>

      <h2>Need Help?</h2>
      <p>
        Can&apos;t find what you&apos;re looking for? Email us at{" "}
        <a href="mailto:support@servlo.com.au">support@servlo.com.au</a>.
      </p>
    </article>
  );
}
