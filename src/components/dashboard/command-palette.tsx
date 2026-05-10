"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Search, Briefcase, Users, FileText, Zap } from "lucide-react";

type ResultIcon = "job" | "client" | "invoice" | "quote" | "nav" | "pricebook" | "employee";

type Result = {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: ResultIcon;
};

const QUICK_ACTIONS: Result[] = [
  { id: "nav-new-job",     label: "New Job",     sub: "Create a job",     href: "/dashboard/owner/jobs",     icon: "nav" },
  { id: "nav-new-invoice", label: "New Invoice", sub: "Create an invoice", href: "/dashboard/owner/invoices", icon: "nav" },
  { id: "nav-new-quote",   label: "New Quote",   sub: "Create a quote",   href: "/dashboard/owner/quotes",   icon: "nav" },
  { id: "nav-new-client",  label: "New Client",  sub: "Add a client",     href: "/dashboard/owner/clients",  icon: "nav" },
  { id: "nav-finance",     label: "Finance",     sub: "Invoices & revenue", href: "/dashboard/owner/finance", icon: "nav" },
  { id: "nav-reports",     label: "Reports",     sub: "Analytics & reports", href: "/dashboard/owner/reports", icon: "nav" },
  { id: "nav-team",        label: "Team",        sub: "Manage employees",  href: "/dashboard/owner/team",     icon: "nav" },
  { id: "nav-settings",    label: "Settings",    sub: "Account & billing",    href: "/dashboard/owner/settings",  icon: "nav" },
  { id: "nav-pricebook",   label: "Pricebook",   sub: "Products & services",  href: "/dashboard/owner/pricebook", icon: "nav" },
  { id: "nav-compliance",  label: "Compliance",  sub: "Documents & certs",    href: "/dashboard/owner/compliance", icon: "nav" },
  { id: "nav-hire",        label: "Hire",        sub: "Recruiting & onboarding", href: "/dashboard/hire",         icon: "nav" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const sb = createSupabaseBrowser();
    const [jobsRes, clientsRes, invoicesRes, quotesRes, priceRes, empRes] = await Promise.all([
      sb.from("jobs").select("id,title,status").ilike("title", `%${q}%`).is("deleted_at", null).limit(4),
      sb.from("clients").select("id,full_name,company_name").or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%`).is("deleted_at", null).limit(4),
      sb.from("invoices").select("id,invoice_number,total").ilike("invoice_number", `%${q}%`).is("deleted_at", null).limit(3),
      sb.from("quotes").select("id,quote_number,total").ilike("quote_number", `%${q}%`).is("deleted_at", null).limit(3),
      sb.from("pricebook_items").select("id,name,unit_price,unit,is_service").ilike("name", `%${q}%`).is("deleted_at", null).limit(3),
      sb.from("employees").select("id,full_name,role").ilike("full_name", `%${q}%`).is("deleted_at", null).limit(3),
    ]);
    const out: Result[] = [];
    for (const j of jobsRes.data ?? []) {
      out.push({ id: `job-${j.id}`, label: j.title ?? "Untitled job", sub: j.status ?? "pending", href: `/dashboard/owner/jobs`, icon: "job" });
    }
    for (const c of clientsRes.data ?? []) {
      out.push({ id: `client-${c.id}`, label: c.full_name ?? "Client", sub: c.company_name ?? "Client", href: `/dashboard/owner/clients/${c.id}`, icon: "client" });
    }
    for (const inv of invoicesRes.data ?? []) {
      out.push({ id: `inv-${inv.id}`, label: inv.invoice_number ?? "Invoice", sub: new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(inv.total ?? 0), href: `/dashboard/owner/invoices`, icon: "invoice" });
    }
    for (const qt of quotesRes.data ?? []) {
      out.push({ id: `quote-${qt.id}`, label: qt.quote_number ?? "Quote", sub: new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(qt.total ?? 0), href: `/dashboard/owner/quotes`, icon: "quote" });
    }
    for (const p of priceRes.data ?? []) {
      out.push({ id: `price-${p.id}`, label: p.name ?? "Item", sub: `${p.is_service ? "Service" : "Product"} · ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(p.unit_price ?? 0)}/${p.unit ?? "each"}`, href: `/dashboard/owner/pricebook`, icon: "pricebook" });
    }
    for (const e of empRes.data ?? []) {
      out.push({ id: `emp-${e.id}`, label: e.full_name ?? "Employee", sub: e.role ?? "team member", href: `/dashboard/owner/team`, icon: "employee" });
    }
    setResults(out);
    setSelectedIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  // The list shown in keyboard navigation: quick actions when empty, results when searching
  const displayList = query.trim() ? results : QUICK_ACTIONS;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, displayList.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && displayList[selectedIdx]) {
      router.push(displayList[selectedIdx].href as any);
      setOpen(false);
    }
  }

  function IconFor({ type }: { type: ResultIcon }) {
    if (type === "job")     return <Briefcase size={14} className="shrink-0 text-[var(--accent-color)]" />;
    if (type === "client")  return <Users     size={14} className="shrink-0 text-emerald-400" />;
    if (type === "invoice") return <FileText  size={14} className="shrink-0 text-amber-400" />;
    if (type === "quote")   return <FileText  size={14} className="shrink-0 text-purple-400" />;
    if (type === "nav")       return <Zap       size={14} className="shrink-0 text-[var(--accent-color)]" />;
    if (type === "pricebook") return <FileText  size={14} className="shrink-0 text-teal-400" />;
    if (type === "employee")  return <Users     size={14} className="shrink-0 text-sky-400" />;
    return null;
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label="Close"
        type="button"
      />
      {/* Palette */}
      <div
        className="fixed left-1/2 top-[15vh] z-[61] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search clients, jobs, invoices, quotes…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <kbd className="shrink-0 rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading && (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Searching…</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">No results for &ldquo;{query}&rdquo;</p>
          )}

          {/* Section header */}
          {!loading && !query.trim() && (
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Quick Actions
            </p>
          )}
          {!loading && query.trim() && results.length > 0 && (
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Results
            </p>
          )}

          {displayList.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { router.push(r.href as any); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i === selectedIdx ? "bg-[var(--bg-secondary)]" : "hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <IconFor type={r.icon} />
              <span className="flex-1 truncate text-[var(--text-primary)]">{r.label}</span>
              <span className="shrink-0 text-xs text-[var(--text-muted)]">{r.sub}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
          <kbd className="rounded bg-[var(--bg-secondary)] px-1 py-0.5">↑↓</kbd> navigate &nbsp;
          <kbd className="rounded bg-[var(--bg-secondary)] px-1 py-0.5">↵</kbd> open &nbsp;
          <kbd className="rounded bg-[var(--bg-secondary)] px-1 py-0.5">⌘K</kbd> toggle
        </div>
      </div>
    </>
  );
}
