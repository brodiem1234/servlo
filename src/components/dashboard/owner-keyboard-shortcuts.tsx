"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isEditableTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

type ShortcutTargets = {
  jobs?: boolean;
  clients?: boolean;
  invoices?: boolean;
  quotes?: boolean;
};

export default function OwnerKeyboardShortcuts({ targets }: { targets?: ShortcutTargets }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const bufRef = useRef("");

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    function clearBufLater() {
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        bufRef.current = "";
      }, 900);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (helpOpen && e.key === "Escape") {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      if (isEditableTarget(e.target)) return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      const k = e.key.length === 1 ? e.key.toLowerCase() : "";
      if (!k || e.ctrlKey || e.metaKey || e.altKey) return;

      bufRef.current = (bufRef.current + k).slice(-4);
      clearBufLater();

      const tail = bufRef.current.slice(-2);
      const allow = {
        jobs: targets?.jobs !== false,
        clients: targets?.clients !== false,
        invoices: targets?.invoices !== false,
        quotes: targets?.quotes !== false
      };
      if (tail === "nj" && allow.jobs) {
        e.preventDefault();
        bufRef.current = "";
        router.push("/dashboard/owner/jobs");
      } else if (tail === "nc" && allow.clients) {
        e.preventDefault();
        bufRef.current = "";
        router.push("/dashboard/owner/clients");
      } else if (tail === "ni" && allow.invoices) {
        e.preventDefault();
        bufRef.current = "";
        router.push("/dashboard/owner/invoices");
      } else if (tail === "nq" && allow.quotes) {
        e.preventDefault();
        bufRef.current = "";
        router.push("/dashboard/owner/quotes");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [router, helpOpen, targets]);

  if (!helpOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Keyboard shortcuts</h2>
          <button
            type="button"
            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)]"
            onClick={() => setHelpOpen(false)}
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Press keys in sequence (within about one second).</p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
          <li>
            <span className="font-mono text-[var(--text-primary)]">N</span> then{" "}
            <span className="font-mono text-[var(--text-primary)]">J</span> — Jobs
          </li>
          <li>
            <span className="font-mono text-[var(--text-primary)]">N</span> then{" "}
            <span className="font-mono text-[var(--text-primary)]">C</span> — Clients
          </li>
          <li>
            <span className="font-mono text-[var(--text-primary)]">N</span> then{" "}
            <span className="font-mono text-[var(--text-primary)]">I</span> — Invoices
          </li>
          <li>
            <span className="font-mono text-[var(--text-primary)]">N</span> then{" "}
            <span className="font-mono text-[var(--text-primary)]">Q</span> — Quotes
          </li>
          <li>
            <span className="font-mono text-[var(--text-primary)]">?</span> — Toggle this panel
          </li>
        </ul>
      </div>
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Dismiss"
        onClick={() => setHelpOpen(false)}
      />
    </div>
  );
}
