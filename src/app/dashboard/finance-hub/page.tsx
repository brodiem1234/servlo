import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FinanceHubDashboard } from "./finance-hub-dashboard";

export const dynamic = "force-dynamic";

export default async function FinanceHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ninety_days_ago = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [txResult, expResult, basResult, invResult] = await Promise.all([
    supabase
      .from("bank_transactions")
      .select("id, date, description, amount, category, reconciled, source")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("expense_claims")
      .select(
        "id, description, amount, status, expense_date, category, submitted_by"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .in("status", ["pending", "approved"])
      .order("expense_date", { ascending: false }),
    supabase
      .from("bas_lodgements")
      .select(
        "id, period_start, period_end, quarter, gst_collected, gst_paid, gst_net, status"
      )
      .eq("owner_id", user.id)
      .order("period_start", { ascending: false })
      .limit(4),
    supabase
      .from("invoices")
      .select("id, total, status, due_date, created_at")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", ninety_days_ago),
  ]);

  const transactions =
    txResult.error?.code === "42P01" ? [] : (txResult.data ?? []);
  const expenses =
    expResult.error?.code === "42P01" ? [] : (expResult.data ?? []);
  const bas = basResult.error?.code === "42P01" ? [] : (basResult.data ?? []);
  const invoices = invResult.data ?? [];

  // Compute invoice stats
  const totalRevenue90d = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (i.total ?? 0), 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.total ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = invoices.filter(
    (i) =>
      (i.status === "sent" || i.status === "overdue") &&
      i.due_date &&
      i.due_date < today
  ).length;

  // Compute bank stats
  const inflow = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const outflow = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const unreconciledCount = transactions.filter((t) => !t.reconciled).length;
  const netCashflow = inflow - outflow;

  const expensesPending = expenses
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const stats = {
    revenue90d: totalRevenue90d,
    outstanding,
    overdueCount,
    inflow,
    outflow,
    unreconciledCount,
    netCashflow,
    expensesPending,
  };

  return (
    <FinanceHubDashboard
      transactions={transactions}
      expenses={expenses}
      basLodgements={bas}
      stats={stats}
    />
  );
}
