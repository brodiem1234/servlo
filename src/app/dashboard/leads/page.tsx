import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, ClipboardList, TrendingUp, DollarSign, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeadsDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = user?.id ?? "";

  // Fetch available leads count
  const { count: availableCount } = await supabase
    .from("leads_marketplace")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");

  // Fetch my accepted leads
  const { data: myLeads } = await supabase
    .from("leads_accepted")
    .select("id, status, marketplace_lead_id")
    .eq("owner_id", ownerId);

  const myLeadsCount = myLeads?.length ?? 0;

  // Conversion rate: won / total accepted
  const wonCount = myLeads?.filter((l) => l.status === "won").length ?? 0;
  const conversionRate =
    myLeadsCount > 0 ? Math.round((wonCount / myLeadsCount) * 100) : 0;

  // Pipeline value: sum estimated_budget from marketplace for active leads
  const activeLeadIds = (myLeads ?? [])
    .filter((l) => !["won", "lost"].includes(l.status ?? ""))
    .map((l) => l.marketplace_lead_id)
    .filter(Boolean) as string[];

  let pipelineValue = 0;
  if (activeLeadIds.length > 0) {
    const { data: budgetRows } = await supabase
      .from("leads_marketplace")
      .select("estimated_budget")
      .in("id", activeLeadIds);
    pipelineValue = (budgetRows ?? []).reduce(
      (sum, r) => sum + (Number(r.estimated_budget) || 0),
      0
    );
  }

  const statCards = [
    {
      label: "Available Leads",
      value: availableCount?.toString() ?? "0",
      Icon: ShoppingBag,
      sub: "In the marketplace",
    },
    {
      label: "My Leads",
      value: myLeadsCount.toString(),
      Icon: ClipboardList,
      sub: "Accepted leads",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      Icon: TrendingUp,
      sub: "Won vs. total",
    },
    {
      label: "Pipeline Value",
      value: `$${pipelineValue.toLocaleString("en-AU")}`,
      Icon: DollarSign,
      sub: "Active estimated budgets",
    },
  ];

  const isEmpty = myLeadsCount === 0;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Leads Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Your leads pipeline at a glance.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-amber-400/30"
          style={{ background: "rgb(245 158 11 / 0.15)", color: "rgb(251 191 36)" }}
        >
          Early access
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "color-mix(in srgb, var(--accent-color) 12%, transparent)",
                }}
              >
                <Icon size={15} style={{ color: "var(--accent-color)" }} />
              </span>
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Quick start when no leads yet */}
      {isEmpty && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Quick start
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Browse available leads",
                description: "Find verified jobs matched to your trade and location.",
                href: "/dashboard/leads/browse",
                Icon: ShoppingBag,
              },
              {
                title: "View your pipeline",
                description: "Track every lead from first contact to won job.",
                href: "/dashboard/leads/pipeline",
                Icon: Zap,
              },
              {
                title: "See conversion stats",
                description: "Understand your win rate and average lead value.",
                href: "/dashboard/leads/my-leads",
                Icon: TrendingUp,
              },
            ].map(({ title, description, href, Icon }) => (
              <Link
                key={href}
                href={href as any}
                className="group flex flex-col gap-3 rounded-xl border p-5 transition hover:border-amber-500/40"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent-color) 14%, transparent)",
                  }}
                >
                  <Icon size={18} style={{ color: "var(--accent-color)" }} />
                </span>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {title}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {description}
                </p>
                <span
                  className="mt-auto flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "var(--accent-color)" }}
                >
                  Go <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity or promo when empty */}
      {!isEmpty && (
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent activity
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            You have {myLeadsCount} lead{myLeadsCount !== 1 ? "s" : ""} in your pipeline. Head to{" "}
            <Link
              href="/dashboard/leads/pipeline"
              className="font-semibold underline"
              style={{ color: "var(--accent-color)" }}
            >
              Pipeline
            </Link>{" "}
            to manage them.
          </p>
        </div>
      )}
    </section>
  );
}
