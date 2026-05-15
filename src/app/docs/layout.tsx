import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

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
 section: "Core. Business Management",
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
 // Grow section temporarily hidden. Feature is still in build. Restore the
 // block here once Grow is ready to ship.
 // {
 // section: "Grow. Marketing",
 // items: [
 // { href: "/docs/grow-overview", label: "Grow Overview" },
 // { href: "/docs/local-seo", label: "Local SEO" },
 // { href: "/docs/reviews", label: "Review Requests" },
 // { href: "/docs/email-marketing", label: "Email Marketing" },
 // { href: "/docs/referrals", label: "Referral Program" },
 // ],
 // },
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
 <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
 <SiteHeader />

 <div className="flex">
 {/* Sidebar. Desktop only. Sticks just below the fixed header (h-16 = 4rem). */}
 <aside className="hidden w-64 shrink-0 border-r border-white/10 lg:block">
 <div
 className="sticky top-16 overflow-y-auto p-6"
 style={{ maxHeight: "calc(100vh - 4rem)" }}
 >
 <div className="mb-8 flex items-center gap-2">
 <span className="text-base font-bold tracking-tight text-white">Documentation</span>
 </div>

 <nav className="space-y-6">
 {DOCS_NAV.map((section) => (
 <div key={section.section}>
 <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
 {section.section}
 </p>
 <ul className="space-y-0.5">
 {section.items.map((item) => (
 <li key={item.href}>
 <Link
 href={item.href}
 className="block rounded-md px-2 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
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

 {/* Mobile docs nav drawer. Shown above content on small screens */}
 <details className="border-b border-white/10 lg:hidden">
 <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-white">
 Documentation menu
 </summary>
 <nav className="space-y-5 px-4 pb-5">
 {DOCS_NAV.map((section) => (
 <div key={section.section}>
 <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
 {section.section}
 </p>
 <ul className="space-y-0.5">
 {section.items.map((item) => (
 <li key={item.href}>
 <Link
 href={item.href}
 className="block rounded-md px-2 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
 >
 {item.label}
 </Link>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </nav>
 </details>

 {/* Content. Each docs page provides its own <article className="prose ...">.
 Wrapping with another article would nest invalidly, so we just
 constrain width + padding here. Typography rules live in
 globals.css and target article.prose globally. */}
 <main className="flex-1 overflow-auto">
 <div className="mx-auto max-w-3xl px-6 py-10 md:px-8 md:py-14">
 {children}
 </div>
 </main>
 </div>
 </div>
 );
}
