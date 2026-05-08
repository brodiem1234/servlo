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

  const admin = createAdminClient();
  const { data: entries } = await admin
    .from("audit_log")
    .select("id, user_id, table_name, record_id, action, changed_fields, ip_address, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);

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
      <AuditLogClient entries={(entries ?? []) as Parameters<typeof AuditLogClient>[0]["entries"]} />
    </div>
  );
}
