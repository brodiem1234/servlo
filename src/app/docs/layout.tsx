import Link from "next/link";

const DOCS_NAV = [
  {
    section: "Getting Started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/quick-start", label: "Quick Start" },
      { href: "/docs/onboarding", label: "Onboarding checklist" },
    ],
  },
  {
    section: "CORE — Business Management",
    items: [
      { href: "/docs/jobs", label: "Jobs & Scheduling" },
      { href: "/docs/clients", label: "Client Management" },
      { href: "/docs/invoices", label: "Invoices & Payments" },
      { href: "/docs/quotes", label: "Quotes" },
      { href: "/docs/team", label: "Team & Timesheets" },
      { href: "/docs/pricebook", label: "Pricebook" },
      { href: "/docs/compliance", label: "Compliance Documents" },
    ],
  },
  {
    section: "GROW — Marketing",
    items: [
      { href: "/docs/grow-overview", label: "GROW Overview" },
      { href: "/docs/local-seo", label: "Local SEO" },
      { href: "/docs/reviews", label: "Review Requests" },
      { href: "/docs/email-marketing", label: "Email Marketing" },
      { href: "/docs/referrals", label: "Referral Program" },
    ],
  },
  {
    section: "Client Portal",
    items: [
      { href: "/docs/client-portal", label: "Client Portal Setup" },
      { href: "/docs/portal-login", label: "Magic Link Login" },
    ],
  },
  {
    section: "Integrations",
    items: [
      { href: "/docs/stripe", label: "Stripe Payments" },
      { href: "/docs/sms", label: "SMS (Twilio)" },
      { href: "/docs/email-setup", label: "Email (Resend)" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 lg:block">
        <div className="sticky top-0 overflow-y-auto p-6" style={{ maxHeight: "100vh" }}>
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-xl font-black tracking-tight text-slate-900">SERVLO</span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">Docs</span>
          </Link>

          <nav className="space-y-6">
            {DOCS_NAV.map((section) => (
              <div key={section.section}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {section.section}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
