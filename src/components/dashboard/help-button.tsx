"use client";

import { useState, useEffect } from "react";
import { HelpCircle, X, ExternalLink, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: "⌘K / Ctrl+K", label: "Open command palette" },
  { keys: "↑↓ + Enter",  label: "Navigate & select results" },
  { keys: "Esc",         label: "Close dialogs & palette" },
];

const QUICK_LINKS = [
  { label: "Dashboard",        href: "/dashboard/owner" },
  { label: "Jobs",             href: "/dashboard/owner/jobs" },
  { label: "Clients",          href: "/dashboard/owner/clients" },
  { label: "Finance",          href: "/dashboard/owner/finance" },
  { label: "Team",             href: "/dashboard/owner/team" },
  { label: "Reports",          href: "/dashboard/reports" },
  { label: "Settings",         href: "/dashboard/owner/settings" },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
          <div className="fixed bottom-32 right-4 z-[60] w-72 overflow-hidden rounded-xl shadow-2xl md:bottom-20" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Help</p>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            </div>

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

            {/* Contact support */}
            <div className="border-t border-[var(--border)] px-4 py-3">
              <a
                href="mailto:hello@servlo.com.au"
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                <ExternalLink size={12} />
                Contact support — hello@servlo.com.au
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
