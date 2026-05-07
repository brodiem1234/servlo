import { createClient } from "@/lib/supabase/server";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import MyLeadsClient, { type LeadRow } from "./my-leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsMyLeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = user?.id ?? "";

  // Fetch accepted leads with marketplace data joined
  const { data: rawLeads } = await supabase
    .from("leads_accepted")
    .select(
      `id, status, created_at, notes, estimated_value,
       marketplace_lead:marketplace_lead_id (
         id, service_type, suburb, description, estimated_budget, contact_name
       )`
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  const leads: LeadRow[] = (rawLeads as LeadRow[] | null) ?? [];

  // ── Stats ───────────────────────────────────────────────────────────────────

  const activeLeads = leads.filter(
    (l) => l.status !== "won" && l.status !== "lost"
  );
  const wonLeads = leads.filter((l) => l.status === "won");
  const conversionRate =
    leads.length > 0
      ? Math.round((wonLeads.length / leads.length) * 100)
      : 0;

  // Pipeline value = sum of estimated_value (or estimated_budget fallback) for active leads
  const pipelineValue = activeLeads.reduce((sum, l) => {
    const val =
      l.estimated_value ?? l.marketplace_lead?.estimated_budget ?? 0;
    return sum + val;
  }, 0);

  const statItems = [
    {
      label: "Active leads",
      value: activeLeads.length.toString(),
    },
    {
      label: "Converted to clients",
      value: wonLeads.length.toString(),
    },
    {
      label: "Pipeline value",
      value: `$${pipelineValue.toLocaleString("en-AU")}`,
    },
    {
      label: "Win rate",
      value: `${conversionRate}%`,
    },
  ];

  // ── Server actions ──────────────────────────────────────────────────────────

  async function updateStatusAction(
    leadId: string,
    status: string
  ): Promise<{ ok: boolean }> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner },
    } = await sb.auth.getUser();
    if (!owner) return { ok: false };
    const { error } = await sb
      .from("leads_accepted")
      .update({ status })
      .eq("id", leadId)
      .eq("owner_id", owner.id);
    if (error) {
      console.error("[my-leads] update status failed", error);
      return { ok: false };
    }
    return { ok: true };
  }

  async function updateNotesAction(
    leadId: string,
    notes: string
  ): Promise<{ ok: boolean }> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner },
    } = await sb.auth.getUser();
    if (!owner) return { ok: false };
    const { error } = await sb
      .from("leads_accepted")
      .update({ notes })
      .eq("id", leadId)
      .eq("owner_id", owner.id);
    if (error) {
      console.error("[my-leads] update notes failed", error);
      return { ok: false };
    }
    return { ok: true };
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            My Leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            All leads you&apos;ve accepted — track status and conversions.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border p-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Table or empty state */}
      {leads.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-20 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--accent-color) 12%, transparent)",
            }}
          >
            <Briefcase size={32} style={{ color: "var(--accent-color)" }} />
          </span>
          <h2
            className="mt-4 text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            No leads yet
          </h2>
          <p
            className="mt-2 max-w-sm text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Browse the marketplace to find jobs near you.
          </p>
          <Link
            href="/dashboard/leads/browse"
            className="mt-5 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "var(--accent-color)" }}
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <MyLeadsClient
          leads={leads}
          updateStatusAction={updateStatusAction}
          updateNotesAction={updateNotesAction}
        />
      )}
    </section>
  );
}
