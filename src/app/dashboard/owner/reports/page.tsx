import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

function isoYearMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
}

/** Build an array of last N year-month strings in order */
function lastNMonths(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(isoYearMonth(d));
  }
  return result;
}

export default async function ReportsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    { data: paidInvoices },
    { data: completedJobs },
    { data: allJobs },
    { data: newClients },
    { data: prevInvoices },
  ] = await Promise.all([
    // Paid invoices for last 12 months
    sb.from("invoices")
      .select("total, paid_at, client_id, is_demo")
      .eq("owner_id", user.id)
      .eq("status", "paid")
      .gte("paid_at", twelveMonthsAgo.toISOString())
      .not("paid_at", "is", null),

    // Completed jobs for last 12 months (for job count)
    sb.from("jobs")
      .select("id, status, completed_at, created_at, is_demo")
      .eq("owner_id", user.id)
      .eq("status", "completed")
      .gte("created_at", twelveMonthsAgo.toISOString()),

    // All jobs for status breakdown
    sb.from("jobs")
      .select("id, status, is_demo")
      .eq("owner_id", user.id)
      .is("deleted_at", null),

    // New clients in last 6 months
    sb.from("clients")
      .select("id")
      .eq("owner_id", user.id)
      .gte("created_at", sixMonthsAgo.toISOString())
      .is("deleted_at", null)
      .eq("is_demo", false),

    // Previous 6-month revenue for change %
    sb.from("invoices")
      .select("total, is_demo")
      .eq("owner_id", user.id)
      .eq("status", "paid")
      .gte("paid_at", (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 12);
        d.setDate(1);
        return d.toISOString();
      })())
      .lt("paid_at", sixMonthsAgo.toISOString()),
  ]);

  // ── Monthly buckets (last 12 months) ──────────────────────────────────────
  const months = lastNMonths(12);
  const monthlyMap: Record<string, { revenue: number; jobs: number }> = {};
  for (const m of months) monthlyMap[m] = { revenue: 0, jobs: 0 };

  for (const inv of paidInvoices ?? []) {
    if ((inv as any).is_demo) continue;
    const paid = (inv as any).paid_at as string;
    const ym = paid.slice(0, 7);
    if (monthlyMap[ym]) {
      monthlyMap[ym].revenue += Number((inv as any).total ?? 0);
    }
  }

  for (const job of completedJobs ?? []) {
    if ((job as any).is_demo) continue;
    const created = ((job as any).completed_at ?? (job as any).created_at) as string;
    const ym = created.slice(0, 7);
    if (monthlyMap[ym]) {
      monthlyMap[ym].jobs += 1;
    }
  }

  const monthly12 = months.map((ym) => ({
    month: monthLabel(ym),
    revenue: Math.round(monthlyMap[ym].revenue * 100) / 100,
    jobs: monthlyMap[ym].jobs,
  }));

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const realPaidInvoices = (paidInvoices ?? []).filter((i: any) => !i.is_demo);
  const recentMonths = lastNMonths(6);
  const revenueThisPeriod = realPaidInvoices
    .filter((i: any) => {
      const paid = (i.paid_at as string).slice(0, 7);
      return recentMonths.includes(paid);
    })
    .reduce((s: number, i: any) => s + Number(i.total ?? 0), 0);

  const prevRevenue = ((prevInvoices ?? []) as any[])
    .filter((i) => !i.is_demo)
    .reduce((s: number, i: any) => s + Number(i.total ?? 0), 0);

  const revenueChange = prevRevenue > 0
    ? ((revenueThisPeriod - prevRevenue) / prevRevenue) * 100
    : null;

  const jobsThisPeriod = (completedJobs ?? []).filter((j: any) => !j.is_demo).length;
  const jobsChange: number | null = null; // Would need prev-period jobs too

  const kpis = {
    revenueTotal: revenueThisPeriod,
    jobsCompleted: jobsThisPeriod,
    avgJobValue: jobsThisPeriod > 0 ? revenueThisPeriod / jobsThisPeriod : 0,
    newClients: (newClients ?? []).length,
    revenueChange,
    jobsChange,
  };

  // ── Job status breakdown (all non-demo jobs) ──────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const job of allJobs ?? []) {
    if ((job as any).is_demo) continue;
    const s = ((job as any).status as string) ?? "pending";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const statusBreakdown = Object.entries(statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // ── Top clients by revenue (last 6 months) ────────────────────────────────
  const clientRevMap: Record<string, number> = {};
  for (const inv of realPaidInvoices) {
    const paid = ((inv as any).paid_at as string).slice(0, 7);
    if (!recentMonths.includes(paid)) continue;
    const cid = (inv as any).client_id as string | null;
    if (!cid) continue;
    clientRevMap[cid] = (clientRevMap[cid] ?? 0) + Number((inv as any).total ?? 0);
  }

  // Fetch client names for top 8
  const topClientIds = Object.entries(clientRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  let topClients: { name: string; revenue: number }[] = [];
  if (topClientIds.length > 0) {
    const { data: clientRows } = await sb
      .from("clients")
      .select("id, full_name, company_name")
      .in("id", topClientIds);
    topClients = topClientIds.map((id) => {
      const row = (clientRows ?? []).find((c: any) => c.id === id);
      const name = (row as any)?.company_name || (row as any)?.full_name || "Unknown client";
      return { name, revenue: Math.round(clientRevMap[id] * 100) / 100 };
    });
  }

  return (
    <ReportsClient
      monthly12={monthly12}
      statusBreakdown={statusBreakdown}
      topClients={topClients}
      kpis={kpis}
    />
  );
}
