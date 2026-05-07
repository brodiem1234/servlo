import { redirect } from "next/navigation";
import type { WorkspaceFeatureId } from "@/lib/workspace-features";
import { reportsBundleEnabled, schedulingEnabled } from "@/lib/workspace-features";

export type WorkspaceNavRequirement =
  | WorkspaceFeatureId
  | "scheduling"
  | "reports_bundle"
  | "finance_any"
  | "team_any";

export function isWorkspaceNavAllowed(enabled: ReadonlySet<WorkspaceFeatureId>, req: WorkspaceNavRequirement): boolean {
  if (req === "scheduling") return schedulingEnabled(enabled);
  if (req === "reports_bundle") return reportsBundleEnabled(enabled);
  if (req === "finance_any") return enabled.has("invoices") || enabled.has("quotes") || enabled.has("purchase_orders");
  if (req === "team_any") return enabled.has("employee_management") || enabled.has("contractors") || enabled.has("timesheets");
  return enabled.has(req);
}

export function guardWorkspaceNav(enabled: ReadonlySet<WorkspaceFeatureId>, req: WorkspaceNavRequirement): void {
  if (!isWorkspaceNavAllowed(enabled, req)) redirect("/dashboard/owner");
}
