"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Briefcase, Users, FileText } from "lucide-react";

const ACTIONS = [
  { label: "New Job", icon: Briefcase, href: "/dashboard/owner/jobs?action=new" },
  { label: "New Client", icon: Users, href: "/dashboard/owner/clients?action=new" },
  { label: "New Invoice", icon: FileText, href: "/dashboard/owner/finance?action=new&tab=invoices" },
  { label: "New Quote", icon: FileText, href: "/dashboard/owner/finance?action=new&tab=quotes" },
] as const;

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6"
    >
      {open && (
        <div className="flex flex-col items-end gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => {
                  setOpen(false);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  router.push(action.href as any);
                }}
                className="flex items-center gap-2"
              >
                <span className="rounded-lg bg-[var(--bg-card)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-md border border-[var(--border)]">
                  {action.label}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] shadow-md">
                  <Icon size={16} className="text-[var(--text-primary)]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close quick actions" : "Quick actions"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-color)] text-white shadow-xl"
        style={{ background: "var(--product-accent, var(--accent-color))" }}
      >
        {open ? <X size={20} /> : <Plus size={20} />}
      </button>
    </div>
  );
}
