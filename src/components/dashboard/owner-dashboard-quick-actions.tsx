"use client";

import Link from "next/link";
import { Briefcase, FileText, Receipt, UserPlus } from "lucide-react";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)]";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-primary)]";

export type QuickActionFlags = {
  scheduling: boolean;
  clients: boolean;
  invoices: boolean;
  quotes: boolean;
};

export default function OwnerDashboardQuickActions({ enabled }: { enabled: QuickActionFlags }) {
  return (
    <div className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {enabled.scheduling ? (
          <Link href="/dashboard/owner/jobs" className={btnPrimary}>
            <Briefcase size={18} aria-hidden />
            New Job
          </Link>
        ) : null}
        {enabled.clients ? (
          <Link href="/dashboard/owner/clients" className={btnPrimary}>
            <UserPlus size={18} aria-hidden />
            New Client
          </Link>
        ) : null}
        {enabled.invoices ? (
          <Link href="/dashboard/owner/invoices" className={btnOutline}>
            <Receipt size={18} aria-hidden />
            New Invoice
          </Link>
        ) : null}
        {enabled.quotes ? (
          <Link href="/dashboard/owner/quotes" className={btnOutline}>
            <FileText size={18} aria-hidden />
            New Quote
          </Link>
        ) : null}
      </div>
    </div>
  );
}
