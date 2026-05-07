"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  owner: "Dashboard",
  jobs: "Jobs",
  clients: "Clients",
  invoices: "Finance",
  quotes: "Finance",
  finance: "Finance",
  team: "Team",
  employees: "Team",
  timesheets: "Team",
  reports: "Reports",
  settings: "Settings",
  schedule: "Schedule",
  appointments: "Appointments",
  "purchase-orders": "Purchase Orders",
  contractors: "Contractors",
  equipment: "Equipment",
  crm: "CRM",
  "getting-started": "Getting Started",
};

type Crumb = { label: string; href: string };

function buildCrumbs(pathname: string): Crumb[] {
  // Only handle owner routes
  if (!pathname.startsWith("/dashboard/owner") && !pathname.startsWith("/dashboard/schedule")) {
    return [];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/dashboard/owner" }];

  let current = "";
  for (const seg of segments) {
    current += `/${seg}`;
    if (seg === "dashboard") continue;
    if (seg === "owner") continue;

    const label = SEGMENT_LABELS[seg];
    // Skip UUID segments — they're detail pages, just show the parent label
    const isUuid = /^[0-9a-f-]{36}$/.test(seg);
    if (isUuid) {
      // Replace the last crumb's text with "Detail" or just skip
      continue;
    }
    if (label) {
      // Don't duplicate
      if (!crumbs.some((c) => c.label === label)) {
        crumbs.push({ label, href: current });
      }
    }
  }

  return crumbs;
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  // Only show if there are more than 1 crumb
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-[var(--text-muted)]">
      <a href="/dashboard/owner" className="flex items-center gap-1 transition-colors hover:text-[var(--text-secondary)]">
        <Home size={11} />
        <span className="sr-only">Home</span>
      </a>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={11} className="shrink-0 opacity-50" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-[var(--text-primary)]">{crumb.label}</span>
          ) : (
            <a href={crumb.href} className="transition-colors hover:text-[var(--text-secondary)]">
              {crumb.label}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
