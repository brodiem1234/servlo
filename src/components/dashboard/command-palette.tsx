"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Search, Briefcase, Users, FileText } from "lucide-react";

type Result = {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: "job" | "client" | "invoice";
};

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
    const [jobsRes, clientsRes, invoicesRes] = await Promise.all([
      sb.from("jobs").select("id,title,status").ilike("title", `%${q}%`).limit(5),
      sb.from("clients").select("id,full_name,company_name").ilike("full_name", `%${q}%`).limit(5),
      sb.from("invoices").select("id,invoice_number,total").ilike("invoice_number", `%${q}%`).limit(5),
    ]);
    const out: Result[] = [];
    for (const j of jobsRes.data ?? []) {
      out.push({ id: j.id, label: j.title ?? "Untitled job", sub: j.status ?? "pending", href: `/dashboard/owner/jobs`, icon: "job" });
    }
    for (const c of clientsRes.data ?? []) {
      out.push({ id: c.id, label: c.full_name ?? "Client", sub: c.company_name ?? "", href: `/dashboard/owner/clients/${c.id}`, icon: "client" });
    }
    for (const inv of invoicesRes.data ?? []) {
      out.push({ id: inv.id, label: inv.invoice_number ?? "Invoice", sub: `$${inv.total ?? 0}`, href: `/dashboard/owner/finance?tab=invoices`, icon: "invoice" });
    }
    setResults(out);
    setSelectedIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) {
      router.push(results[selectedIdx].href);
      setOpen(false);
    }
  }

  function IconFor({ type }: { type: Result["icon"] }) {
    if (type === "job")     return <Briefcase size={14} className="shrink-0 text-[var(--accent-color)]" />;
    if (type === "client")  return <Users     size={14} className="shrink-0 text-emerald-400" />;
    if (type === "invoice") return <FileText  size={14} className="shrink-0 text-amber-400" />;
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
            placeholder="Search clients, jobs, invoices…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <kbd className="shrink-0 rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-auto">
          {loading && (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Searching…</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">No results for &ldquo;{query}&rdquo;</p>
          )}
          {!loading && !query && (
            <p className="px-4 py-3 text-xs text-[var(--text-muted)]">Type to search across clients, jobs, and invoices.</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { router.push(r.href); setOpen(false); }}
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
