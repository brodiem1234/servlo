import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MyLeadsClient, { type LeadRow } from "./my-leads-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SERVLO Leads — My Leads",
};

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

      {/* Stats bar — always shown */}
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

      {/* How it works — always shown */}
      <div className="rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>How it works</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { step: "1", icon: "🔍", title: "Browse Leads", desc: "Find verified job requests matched to your trade and suburb." },
            { step: "2", icon: "✅", title: "Accept a Lead", desc: "Pay a small fee to unlock the customer's contact details." },
            { step: "3", icon: "👤", title: "Convert to Client", desc: "Win the job and convert the lead into a long-term client." },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                {icon}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table or rich empty state */}
      {leads.length === 0 ? (
        <>
          {/* Rich empty state */}
          <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl" style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.3)" }}>
              🎯
            </div>
            <h2 className="mt-5 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Your leads pipeline starts here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
              Accept a lead from the marketplace to see it here. Track status, take notes, and convert leads into long-term clients — all in one place.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/leads/browse"
                className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-bold text-white"
                style={{ background: "#F59E0B" }}
              >
                Browse Leads
              </Link>
              <Link
                href="/dashboard/leads/browse"
                className="inline-flex items-center rounded-lg border px-6 py-2.5 text-sm font-semibold transition-colors"
                style={{ borderColor: "rgba(245,158,11,0.4)", color: "#FCD34D", background: "rgba(245,158,11,0.08)" }}
              >
                Set up lead alerts
              </Link>
            </div>
          </div>

          {/* Skeleton preview */}
          <div className="space-y-2 opacity-40 select-none pointer-events-none">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Preview — what your leads will look like</p>
            {[
              { service: "Plumbing repair", suburb: "Parramatta", days: "2d", status: "New", value: "$350" },
              { service: "Electrical quote", suburb: "Chatswood", days: "5d", status: "Contacted", value: "$1,200" },
              { service: "Roof inspection", suburb: "Penrith", days: "1d", status: "Quoted", value: "$800" },
            ].map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.service}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.suburb}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.days}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#FCD34D" }}>{r.status}</span>
                <span className="ml-auto text-sm font-bold" style={{ color: "#F59E0B" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </>
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
