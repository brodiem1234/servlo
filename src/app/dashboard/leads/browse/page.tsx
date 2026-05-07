import { createClient } from "@/lib/supabase/server";
import BrowseLeadsClient, { DEMO_LEADS } from "./browse-leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsBrowsePage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads_marketplace")
    .select(
      "id, suburb, postcode, service_type, description, urgency, estimated_budget, status, is_demo, created_at"
    )
    .eq("is_demo", true)
    .order("created_at", { ascending: false });

  // Use server data if available; the client will merge in DEMO_LEADS for a
  // rich demo experience even when the table is empty.
  const leadsData = leads ?? [];

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Browse Leads Marketplace
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Demo leads — live marketplace launches Q4 2026. You&apos;re on the
            early access list.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-amber-400/30"
          style={{
            background: "rgb(245 158 11 / 0.15)",
            color: "rgb(251 191 36)",
          }}
        >
          {leadsData.length > 0
            ? `${leadsData.length} demo leads`
            : `${DEMO_LEADS.length} demo leads`}
        </span>
      </div>

      <BrowseLeadsClient leads={leadsData} />
    </section>
  );
}
