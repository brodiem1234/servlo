import type { WorkspaceNavRequirement } from "@/lib/workspace-feature-guard";
import { isWorkspaceNavAllowed } from "@/lib/workspace-feature-guard";
import type { WorkspaceFeatureId } from "@/lib/workspace-features";

export type OwnerNavItem = {
  href: string;
  label: string;
  /** Omit or null = always visible for owners */
  req?: WorkspaceNavRequirement | null;
};

export type OwnerNavSection = {
  /** If present, the section renders as a collapsible group with this label */
  groupLabel?: string;
  /** If true, this section is rendered pinned to the bottom of the sidebar */
  pinnedBottom?: boolean;
  items: OwnerNavItem[];
};

export const OWNER_NAV_SECTIONS: OwnerNavSection[] = [
  { items: [{ href: "/dashboard/owner", label: "Dashboard", req: null }] },
  {
    groupLabel: "Jobs & Schedule",
    items: [
      { href: "/dashboard/owner/jobs", label: "Jobs", req: "scheduling" },
      { href: "/dashboard/schedule", label: "Schedule", req: "scheduling" },
    ],
  },
  { items: [{ href: "/dashboard/owner/clients", label: "Clients", req: "client_management" }] },
  {
    groupLabel: "Finance",
    items: [
      { href: "/dashboard/owner/invoices", label: "Invoices", req: "invoices" },
      { href: "/dashboard/owner/quotes", label: "Quotes", req: "quotes" },
      { href: "/dashboard/owner/purchase-orders", label: "Purchase orders", req: "purchase_orders" },
    ],
  },
  {
    groupLabel: "Team",
    items: [
      { href: "/dashboard/owner/employees", label: "Employees", req: "employee_management" },
      { href: "/dashboard/contractors", label: "Contractors", req: "contractors" },
      { href: "/dashboard/owner/timesheets", label: "Timesheets", req: "timesheets" },
    ],
  },
  { items: [{ href: "/dashboard/reports", label: "Reports", req: "reports_bundle" }] },
  { pinnedBottom: true, items: [{ href: "/dashboard/owner/settings", label: "Settings", req: null }] },
];

export function filterOwnerNavSections(
  sections: OwnerNavSection[],
  enabled: ReadonlySet<WorkspaceFeatureId>
): OwnerNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.req == null || isWorkspaceNavAllowed(enabled, item.req)),
    }))
    .filter((section) => section.items.length > 0);
}
