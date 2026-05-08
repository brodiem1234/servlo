/**
 * Audit logging for compliance, security review, and dispute resolution.
 * Uses admin client — call only from server-side code (API routes, server components, server actions).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction = "created" | "updated" | "deleted" | "exported" | "viewed";

export interface AuditParams {
  userId: string;
  businessId: string | null;
  table: string;
  recordId: string | null;
  action: AuditAction;
  changedFields?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an auditable event. Swallows errors — audit failures must never break the main flow.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const admin = createAdminClient();

    let ip_address: string | null = null;
    let user_agent: string | null = null;

    if (params.request) {
      const headers = params.request.headers;
      ip_address =
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headers.get("x-real-ip") ??
        null;
      user_agent = headers.get("user-agent") ?? null;
    }

    await admin.from("audit_log").insert({
      user_id: params.userId,
      business_id: params.businessId,
      table_name: params.table,
      record_id: params.recordId,
      action: params.action,
      changed_fields: params.changedFields ?? null,
      ip_address,
      user_agent,
    });
  } catch (err) {
    // Swallow — audit log failure must never break the caller
    console.error("[audit] logAudit error:", err);
  }
}
