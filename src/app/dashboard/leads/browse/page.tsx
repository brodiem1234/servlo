import { createClient } from "@/lib/supabase/server";
import { ShoppingBag } from "lucide-react";
import BrowseLeadsClient from "./browse-leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsBrowsePage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads_marketplace")
    .select("id, suburb, postcode, service_type, description, urgency, estimated_budget, status, is_demo, created_at")
    .eq("is_demo", true)
    .order("created_at", { ascending: false });

  const leadsData = leads ?? [];

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Browse Leads Marketplace
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Demo leads — live marketplace launches Q4 2026. You&apos;re on the early access list.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-amber-400/30"
          style={{ background: "rgb(245 158 11 / 0.15)", color: "rgb(251 191 36)" }}
        >
          {leadsData.length} demo leads
        </span>
      </div>

      {leadsData.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-20 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)" }}
          >
            <ShoppingBag size={32} style={{ color: "var(--accent-color)" }} />
          </span>
          <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            No demo leads yet
          </h2>
          <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
            Demo leads will appear here once seeded. The live marketplace launches Q4 2026.
          </p>
        </div>
      ) : (
        <BrowseLeadsClient leads={leadsData} />
      )}
    </section>
  );
}
