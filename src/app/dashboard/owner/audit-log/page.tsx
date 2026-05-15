import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLogClient } from "./audit-log-client";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get the business id for this owner
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const businessId = business?.id ?? null;

  // If the owner hasn't completed business setup yet there's nothing to show.
  // Previously this fired a query with business_id = null which would either
  // return rows for null business_id (cross-org leak risk) or all rows
  // depending on RLS behaviour.
  let entries: Array<Record<string, unknown>> = [];
  if (businessId) {
    const admin = createAdminClient();
    const { data, error: auditError } = await admin
      .from("audit_log")
      .select("id, user_id, table_name, record_id, action, changed_fields, ip_address, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(200);

    entries = (data ?? []) as Array<Record<string, unknown>>;

    if (auditError && (auditError as { code?: string }).code !== "42P01") {
      console.error("[audit-log] fetch error:", auditError.message);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary, #0f172a)" }}>
          Audit Log
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary, #64748b)" }}>
          A record of all significant actions taken in your SERVLO workspace. Useful for compliance and dispute resolution.
        </p>
      </div>
      <AuditLogClient entries={entries as Parameters<typeof AuditLogClient>[0]["entries"]} />
    </div>
  );
}
