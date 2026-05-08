"use client";

import { useState, useEffect, useCallback } from "react";
import { HelpCircle, X, ExternalLink, Keyboard, RotateCcw, Search, ChevronRight, MessageSquare } from "lucide-react";
import { resetOnboarding } from "@/app/dashboard/owner/actions";
import { usePathname } from "next/navigation";

const SHORTCUTS = [
  { keys: "⌘K / Ctrl+K", label: "Open command palette" },
  { keys: "↑↓ + Enter",  label: "Navigate & select results" },
  { keys: "Esc",         label: "Close dialogs & palette" },
];

const QUICK_LINKS = [
  { label: "Dashboard",  href: "/dashboard/owner" },
  { label: "Jobs",       href: "/dashboard/owner/jobs" },
  { label: "Clients",    href: "/dashboard/owner/clients" },
  { label: "Finance",    href: "/dashboard/owner/finance" },
  { label: "Team",       href: "/dashboard/owner/team" },
  { label: "Reports",    href: "/dashboard/reports" },
  { label: "Settings",   href: "/dashboard/owner/settings" },
];

type HelpArticle = {
  title: string;
  summary: string;
  href: string;
  tags: string[];
};

const HELP_ARTICLES: HelpArticle[] = [
  { title: "Creating your first job", summary: "Schedule a job, assign an employee, and track progress.", href: "/dashboard/owner/jobs", tags: ["job", "schedule", "create"] },
  { title: "Sending a quote to a client", summary: "Generate and email a professional quote in minutes.", href: "/dashboard/owner/quotes", tags: ["quote", "send", "client", "estimate"] },
  { title: "Invoicing a completed job", summary: "Convert a job directly into an invoice with one click.", href: "/dashboard/owner/invoices", tags: ["invoice", "billing", "payment"] },
  { title: "Setting up online booking", summary: "Let clients book appointments from your website.", href: "/dashboard/owner/settings/booking", tags: ["booking", "online", "calendar", "appointment"] },
  { title: "Adding your team members", summary: "Invite employees and assign jobs to them.", href: "/dashboard/owner/team", tags: ["team", "employee", "invite", "user"] },
  { title: "Connecting Xero or MYOB", summary: "Sync invoices and clients with your accounting software.", href: "/dashboard/owner/settings", tags: ["xero", "myob", "accounting", "integration"] },
  { title: "BAS helper and GST reports", summary: "Calculate your quarterly BAS with AI assistance.", href: "/dashboard/owner/bas", tags: ["bas", "gst", "tax", "ato", "report"] },
  { title: "Setting up job automations", summary: "Send automatic emails when job status changes.", href: "/dashboard/owner/settings/automations", tags: ["automation", "email", "trigger", "status"] },
  { title: "Bulk actions on jobs", summary: "Select multiple jobs to update status or delete in bulk.", href: "/dashboard/owner/jobs", tags: ["bulk", "select", "delete", "update"] },
  { title: "Two-factor authentication", summary: "Enable 2FA with an authenticator app for extra security.", href: "/dashboard/owner/settings/security", tags: ["2fa", "security", "totp", "authenticator"] },
  { title: "AI quote generation", summary: "Use AI to draft quotes from a job description.", href: "/dashboard/owner/quotes", tags: ["ai", "quote", "generate", "draft"] },
  { title: "Importing clients from CSV", summary: "Bulk-import your client list from a spreadsheet.", href: "/dashboard/owner/settings", tags: ["import", "csv", "client", "bulk"] },
  { title: "Recurring jobs", summary: "Set up jobs that repeat weekly, fortnightly, or monthly.", href: "/dashboard/owner/jobs", tags: ["recurring", "repeat", "schedule", "weekly"] },
  { title: "Client portal", summary: "Give clients a link to view their invoices and jobs.", href: "/dashboard/owner/clients", tags: ["portal", "client", "link", "view"] },
  { title: "Cancelling or pausing your subscription", summary: "Options to pause, get a discount, or cancel.", href: "/dashboard/owner/settings", tags: ["cancel", "pause", "subscription", "billing"] },
];

// Contextual tips per route prefix
const CONTEXTUAL_TIPS: Record<string, { tip: string; link?: string }> = {
  "/dashboard/owner/jobs": { tip: "Tip: Select multiple jobs with the checkbox column to bulk-update status.", link: "/dashboard/owner/jobs" },
  "/dashboard/owner/quotes": { tip: "Tip: Click ✨ AI Draft to generate a quote from a job description in seconds." },
  "/dashboard/owner/invoices": { tip: "Tip: Completed jobs can be converted to invoices with one click." },
  "/dashboard/owner/clients": { tip: "Tip: Click a client to see all their jobs, invoices, and quotes." },
  "/dashboard/owner/settings": { tip: "Tip: Enable job automations to send emails when job status changes.", link: "/dashboard/owner/settings/automations" },
  "/dashboard/owner/finance": { tip: "Tip: Try the BAS Helper to calculate your quarterly GST obligations.", link: "/dashboard/owner/bas" },
  "/dashboard/owner/team": { tip: "Tip: Employees can clock in/out and submit timesheets from their own login." },
};

function getContextualTip(pathname: string): { tip: string; link?: string } | null {
  for (const [prefix, tip] of Object.entries(CONTEXTUAL_TIPS)) {
    if (pathname.startsWith(prefix)) return tip;
  }
  return null;
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [restartMsg, setRestartMsg] = useState("");
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  const ctxTip = getContextualTip(pathname);

  const filteredArticles = query.trim().length >= 2
    ? HELP_ARTICLES.filter((a) => {
        const q = query.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q));
      })
    : null;

  const handleRestartTour = useCallback(async () => {
    await resetOnboarding();
    setRestartMsg("Refresh the page to start the tour");
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset search when closed
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help"
        className="fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] shadow-lg transition-colors hover:text-[var(--accent-color)] md:bottom-6"
      >
        {open ? <X size={18} /> : <HelpCircle size={18} />}
      </button>

      {/* Panel */}
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[59]"
            onClick={() => setOpen(false)}
            aria-label="Close help"
          />
          <div className="fixed bottom-32 right-4 z-[60] w-80 overflow-hidden rounded-xl shadow-2xl md:bottom-20" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Help & Support</p>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help articles…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)]"
                />
              </div>
            </div>

            {/* Search results */}
            {filteredArticles !== null ? (
              <div className="max-h-52 overflow-y-auto px-3 pb-2">
                {filteredArticles.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">No articles found. Try different keywords.</p>
                ) : (
                  filteredArticles.map((a) => (
                    <a
                      key={a.href + a.title}
                      href={a.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-white/8 transition-colors"
                    >
                      <ChevronRight size={12} className="mt-0.5 shrink-0 text-slate-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-300">{a.title}</p>
                        <p className="text-[10px] text-slate-500">{a.summary}</p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Contextual tip */}
                {ctxTip ? (
                  <div className="mx-3 mb-2 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 px-3 py-2">
                    <p className="text-[11px] text-[var(--accent-color)]">{ctxTip.tip}</p>
                  </div>
                ) : null}

                {/* Quick links */}
                <div className="px-3 py-2">
                  <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Quick links</p>
                  <div className="grid grid-cols-2 gap-1">
                    {QUICK_LINKS.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-white/8 hover:text-slate-200 transition-colors"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Keyboard shortcuts */}
                <div className="border-t border-[var(--border)] px-3 py-2">
                  <p className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    <Keyboard size={10} />
                    Keyboard shortcuts
                  </p>
                  <div className="space-y-1">
                    {SHORTCUTS.map((s) => (
                      <div key={s.keys} className="flex items-center justify-between px-1 text-xs">
                        <span className="text-[var(--text-secondary)]">{s.label}</span>
                        <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-700">
                          {s.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restart tour */}
                <div className="border-t border-[var(--border)] px-4 py-3">
                  <button
                    type="button"
                    onClick={handleRestartTour}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RotateCcw size={12} />
                    Restart onboarding tour
                  </button>
                  {restartMsg ? (
                    <p className="text-xs text-green-400 mt-1">{restartMsg}</p>
                  ) : null}
                </div>
              </>
            )}

            {/* Contact support */}
            <div className="border-t border-[var(--border)] px-4 py-3">
              <a
                href="mailto:support@servlo.com.au"
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                <MessageSquare size={12} />
                Contact support
              </a>
              <a
                href="mailto:support@servlo.com.au"
                className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors mt-0.5 pl-5"
              >
                <ExternalLink size={9} />
                support@servlo.com.au
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
