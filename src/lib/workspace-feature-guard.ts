import { redirect } from "next/navigation";
import type { WorkspaceFeatureId } from "@/lib/workspace-features";
import { reportsBundleEnabled, schedulingEnabled } from "@/lib/workspace-features";

export type WorkspaceNavRequirement = WorkspaceFeatureId | "scheduling" | "reports_bundle";

export function isWorkspaceNavAllowed(enabled: ReadonlySet<WorkspaceFeatureId>, req: WorkspaceNavRequirement): boolean {
  if (req === "scheduling") return schedulingEnabled(enabled);
  if (req === "reports_bundle") return reportsBundleEnabled(enabled);
  return enabled.has(req);
}

export function guardWorkspaceNav(enabled: ReadonlySet<WorkspaceFeatureId>, req: WorkspaceNavRequirement): void {
  if (!isWorkspaceNavAllowed(enabled, req)) redirect("/dashboard/owner");
}
