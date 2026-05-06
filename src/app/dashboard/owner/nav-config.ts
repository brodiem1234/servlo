import type { WorkspaceNavRequirement } from "@/lib/workspace-feature-guard";
import { isWorkspaceNavAllowed } from "@/lib/workspace-feature-guard";
import type { WorkspaceFeatureId } from "@/lib/workspace-features";

export type OwnerNavItem = {
  href: string;
  label: string;
  /** Omit or null = always visible for owners */
  req?: WorkspaceNavRequirement | null;
};

/** Sidebar + mobile “More” structure */
export const OWNER_NAV_SECTIONS: OwnerNavItem[][] = [
  [{ href: "/dashboard/owner", label: "Dashboard", req: null }],
  [
    { href: "/dashboard/owner/jobs", label: "Jobs", req: "scheduling" },
    { href: "/dashboard/owner/clients", label: "Clients", req: "client_management" }
  ],
  [{ href: "/dashboard/schedule", label: "Schedule", req: "scheduling" }],
  [
    { href: "/dashboard/owner/invoices", label: "Invoices", req: "invoices" },
    { href: "/dashboard/owner/quotes", label: "Quotes", req: "quotes" },
    { href: "/dashboard/owner/purchase-orders", label: "Purchase orders", req: "purchase_orders" }
  ],
  [
    { href: "/dashboard/owner/employees", label: "Employees", req: "employee_management" },
    { href: "/dashboard/owner/timesheets", label: "Timesheets", req: "timesheets" },
    { href: "/dashboard/contractors", label: "Contractors", req: "contractors" }
  ],
  [{ href: "/dashboard/reports", label: "Reports", req: "reports_bundle" }],
  [{ href: "/dashboard/owner/settings", label: "Settings", req: null }]
];

export function filterOwnerNavSections(
  sections: OwnerNavItem[][],
  enabled: ReadonlySet<WorkspaceFeatureId>
): OwnerNavItem[][] {
  return sections
    .map((section) =>
      section.filter((item) => item.req == null || isWorkspaceNavAllowed(enabled, item.req))
    )
    .filter((section) => section.length > 0);
}
