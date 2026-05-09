import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PayDashboard } from "./pay-dashboard";

export const dynamic = "force-dynamic";

export default async function PayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [txResult, invoiceResult] = await Promise.all([
    supabase
      .from("payment_transactions")
      .select(
        "id, invoice_id, client_id, amount, currency, payment_method, status, stripe_pi_id, fee_amount, net_amount, paid_at, description, created_at"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("paid_at", { ascending: false })
      .limit(50),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, due_date")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .in("status", ["sent", "overdue"]),
  ]);

  let transactions: PayTransaction[] = [];
  if (txResult.error) {
    if (txResult.error.code !== "42P01") {
      console.error("payment_transactions fetch error:", txResult.error.message);
    }
  } else {
    transactions = (txResult.data ?? []) as PayTransaction[];
  }

  const invoices = (invoiceResult.data ?? []) as OutstandingInvoice[];

  const succeeded30d = transactions.filter(
    (t) =>
      t.status === "succeeded" &&
      t.paid_at &&
      new Date(t.paid_at) >= thirtyDaysAgo
  );

  const stats = {
    totalProcessed: succeeded30d.reduce((s, t) => s + (t.amount ?? 0), 0),
    totalFees: succeeded30d.reduce((s, t) => s + (t.fee_amount ?? 0), 0),
    netReceived: succeeded30d.reduce((s, t) => s + (t.net_amount ?? 0), 0),
    outstandingInvoices: invoices.reduce((s, i) => s + (i.total ?? 0), 0),
  };

  return (
    <PayDashboard transactions={transactions} outstandingInvoices={invoices} stats={stats} />
  );
}

export type PayTransaction = {
  id: string;
  invoice_id: string | null;
  client_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  stripe_pi_id: string | null;
  fee_amount: number | null;
  net_amount: number | null;
  paid_at: string | null;
  description: string | null;
  created_at: string;
};

export type OutstandingInvoice = {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  due_date: string | null;
};

export type PayStats = {
  totalProcessed: number;
  totalFees: number;
  netReceived: number;
  outstandingInvoices: number;
};
