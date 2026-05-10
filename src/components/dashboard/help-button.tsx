"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HelpCircle, X, ExternalLink, Keyboard, RotateCcw, Search, ChevronRight, MessageSquare, Lightbulb, Bug, ThumbsUp } from "lucide-react";
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

type FeatureRequest = {
  id: string;
  title: string;
  description: string | null;
  upvotes: number;
};

type Tab = "help" | "feature" | "bug";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("help");
  const [restartMsg, setRestartMsg] = useState("");
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  // Feature request state
  const [frTitle, setFrTitle] = useState("");
  const [frDesc, setFrDesc] = useState("");
  const [frSubmitting, setFrSubmitting] = useState(false);
  const [frSuccess, setFrSuccess] = useState(false);
  const [frRequests, setFrRequests] = useState<FeatureRequest[]>([]);
  const [frLoaded, setFrLoaded] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Bug report state
  const [bugDoing, setBugDoing] = useState("");
  const [bugWrong, setBugWrong] = useState("");
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);

  // Console error capture
  const consoleErrors = useRef<string[]>([]);
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrors.current.push(args.map(String).join(" ").slice(0, 500));
      originalError(...args);
    };
    return () => { console.error = originalError; };
  }, []);

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

  // Load feature requests when tab opens
  useEffect(() => {
    if (tab === "feature" && !frLoaded) {
      fetch("/api/feedback/feature-request")
        .then((r) => r.json())
        .then((d: { data?: FeatureRequest[] }) => { setFrRequests(d.data ?? []); setFrLoaded(true); })
        .catch(() => setFrLoaded(true));
    }
  }, [tab, frLoaded]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setFrSuccess(false); setBugSuccess(false); }
  }, [open]);

  // External open via top-bar HelpCircle button (mobile)
  useEffect(() => {
    function onOpen(_e: Event) { setOpen(true); }
    window.addEventListener("servlo:open-help", onOpen);
    return () => window.removeEventListener("servlo:open-help", onOpen);
  }, []);

  async function submitFeatureRequest() {
    if (!frTitle.trim()) return;
    setFrSubmitting(true);
    try {
      const res = await fetch("/api/feedback/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: frTitle.trim(), description: frDesc.trim() || undefined }),
      });
      if (res.ok) {
        setFrSuccess(true);
        setFrTitle("");
        setFrDesc("");
        setFrLoaded(false); // Reload requests
      }
    } finally {
      setFrSubmitting(false);
    }
  }

  async function handleUpvote(requestId: string) {
    setVotingId(requestId);
    try {
      const res = await fetch("/api/feedback/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        const data = await res.json() as { upvotes?: number };
        setFrRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, upvotes: data.upvotes ?? r.upvotes } : r));
      }
    } finally {
      setVotingId(null);
    }
  }

  async function submitBugReport() {
    if (!bugDoing.trim() || !bugWrong.trim()) return;
    setBugSubmitting(true);
    try {
      const res = await fetch("/api/feedback/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatDoing: bugDoing.trim(),
          whatWentWrong: bugWrong.trim(),
          currentUrl: typeof window !== "undefined" ? window.location.href : undefined,
          browserInfo: typeof navigator !== "undefined" ? { userAgent: navigator.userAgent } : undefined,
          consoleErrors: consoleErrors.current.slice(-10),
        }),
      });
      if (res.ok) {
        setBugSuccess(true);
        setBugDoing("");
        setBugWrong("");
      }
    } finally {
      setBugSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)]";

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help"
        className="hidden"
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
          <div className="fixed bottom-4 right-4 z-[60] w-80 overflow-hidden rounded-xl shadow-2xl md:bottom-16" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Help & Support</p>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-white/10">
              {([
                { id: "help" as Tab, icon: <Search size={12} />, label: "Help" },
                { id: "feature" as Tab, icon: <Lightbulb size={12} />, label: "Request" },
                { id: "bug" as Tab, icon: <Bug size={12} />, label: "Bug" },
              ] as const).map(({ id, icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                    tab === id
                      ? "border-b-2 border-[var(--accent-color)] text-[var(--accent-color)]"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* ── Help tab ─────────────────────────────────────────────── */}
            {tab === "help" && (
              <>
                {/* Search */}
                <div className="px-3 pt-3 pb-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search help articles…"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>

                {filteredArticles !== null ? (
                  <div className="max-h-52 overflow-y-auto px-3 pb-2">
                    {filteredArticles.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-500">No articles found.</p>
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
                    {ctxTip ? (
                      <div className="mx-3 mb-2 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 px-3 py-2">
                        <p className="text-[11px] text-[var(--accent-color)]">{ctxTip.tip}</p>
                      </div>
                    ) : null}

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

                    <div className="border-t border-[var(--border)] px-3 py-2">
                      <p className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        <Keyboard size={10} /> Keyboard shortcuts
                      </p>
                      <div className="space-y-1">
                        {SHORTCUTS.map((s) => (
                          <div key={s.keys} className="flex items-center justify-between px-1 text-xs">
                            <span className="text-[var(--text-secondary)]">{s.label}</span>
                            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-700">{s.keys}</kbd>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[var(--border)] px-4 py-3">
                      <button
                        type="button"
                        onClick={handleRestartTour}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <RotateCcw size={12} /> Restart onboarding tour
                      </button>
                      {restartMsg && <p className="text-xs text-green-400 mt-1">{restartMsg}</p>}
                    </div>
                  </>
                )}

                <div className="border-t border-[var(--border)] px-4 py-3">
                  <a href="mailto:support@servlo.com.au" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                    <MessageSquare size={12} /> Contact support
                  </a>
                  <a href="mailto:support@servlo.com.au" className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors mt-0.5 pl-5">
                    <ExternalLink size={9} /> support@servlo.com.au
                  </a>
                </div>
              </>
            )}

            {/* ── Feature Request tab ──────────────────────────────────── */}
            {tab === "feature" && (
              <div className="px-3 py-3 space-y-3 max-h-96 overflow-y-auto">
                {frSuccess ? (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400">
                    Request submitted! Thank you for the feedback.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Submit a request</p>
                    <input
                      type="text"
                      value={frTitle}
                      onChange={(e) => setFrTitle(e.target.value)}
                      placeholder="What feature would you like?"
                      className={inputCls}
                      maxLength={200}
                    />
                    <textarea
                      value={frDesc}
                      onChange={(e) => setFrDesc(e.target.value)}
                      placeholder="Details (optional)"
                      rows={2}
                      className={`${inputCls} resize-none`}
                      maxLength={2000}
                    />
                    <button
                      type="button"
                      onClick={submitFeatureRequest}
                      disabled={frSubmitting || frTitle.trim().length < 3}
                      className="w-full rounded-lg bg-[var(--accent-color)] py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {frSubmitting ? "Submitting…" : "Submit request"}
                    </button>
                  </div>
                )}

                {/* Top requests */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Top requests</p>
                  {!frLoaded ? (
                    <p className="text-xs text-slate-500 py-2">Loading…</p>
                  ) : frRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No requests yet — be the first!</p>
                  ) : (
                    <div className="space-y-1.5">
                      {frRequests.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 truncate">{r.title}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpvote(r.id)}
                            disabled={votingId === r.id}
                            className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-[var(--accent-color)]/20 hover:text-[var(--accent-color)] transition-colors disabled:opacity-50"
                          >
                            <ThumbsUp size={9} /> {r.upvotes}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Bug Report tab ───────────────────────────────────────── */}
            {tab === "bug" && (
              <div className="px-3 py-3 space-y-3">
                {bugSuccess ? (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-3 text-xs text-green-400">
                    Bug report sent! We&apos;ll look into it shortly. Thank you.
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-500">We&apos;ll automatically include your browser info to help us fix this faster.</p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">What were you doing?</label>
                      <textarea
                        value={bugDoing}
                        onChange={(e) => setBugDoing(e.target.value)}
                        placeholder="e.g. I was creating a new invoice for a client"
                        rows={2}
                        className={`${inputCls} resize-none`}
                        maxLength={2000}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">What went wrong?</label>
                      <textarea
                        value={bugWrong}
                        onChange={(e) => setBugWrong(e.target.value)}
                        placeholder="e.g. The page showed an error and the invoice wasn't saved"
                        rows={2}
                        className={`${inputCls} resize-none`}
                        maxLength={2000}
                      />
                    </div>
                    {/* TODO: Add html2canvas for optional screenshot capture. Install: npm install html2canvas */}
                    <button
                      type="button"
                      onClick={submitBugReport}
                      disabled={bugSubmitting || bugDoing.trim().length < 5 || bugWrong.trim().length < 5}
                      className="w-full rounded-lg bg-red-600/80 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {bugSubmitting ? "Sending…" : "Send bug report"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
