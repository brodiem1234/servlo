import { revalidatePath } from "next/cache";

/** Bust RSC cache for owner dashboards/lists after mutating shared entities (clients, jobs, …). */
export function revalidateOwnerWorkspaceRoutes() {
  revalidatePath("/dashboard/owner", "layout");
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/owner/clients");
  revalidatePath("/dashboard/owner/jobs");
  revalidatePath("/dashboard/owner/invoices");
  revalidatePath("/dashboard/owner/quotes");
  revalidatePath("/dashboard/owner/employees");
  revalidatePath("/dashboard/owner/purchase-orders");
  revalidatePath("/dashboard/owner/settings");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/contractors");
}

