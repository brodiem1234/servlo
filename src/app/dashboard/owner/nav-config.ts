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
  {
    items: [
      { href: "/dashboard/owner",         label: "Dashboard", req: null },
      { href: "/dashboard/owner/jobs",    label: "Jobs",      req: "scheduling" },
      { href: "/dashboard/owner/clients", label: "Clients",   req: "client_management" },
      { href: "/dashboard/owner/comms",   label: "Comms",     req: "client_management" },
      { href: "/dashboard/owner/finance", label: "Finance",   req: "finance_any" },
      { href: "/dashboard/owner/team",    label: "Team",      req: "team_any" },
      { href: "/dashboard/reports",       label: "Reports",   req: "reports_bundle" },
    ],
  },
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
