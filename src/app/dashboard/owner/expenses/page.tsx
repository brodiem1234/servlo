import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExpensesManager } from "./expenses-manager";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const [expensesRes, employeesRes] = await Promise.all([
    sb.from("expense_claims")
      .select("id, description, amount, category, status, receipt_url, submitted_at, approved_at, notes, employee_id, job_id, created_at")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    sb.from("employees")
      .select("id, full_name")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("full_name"),
  ]);

  const expenses = (expensesRes.error?.code === "42P01" ? [] : expensesRes.data ?? []) as Array<{
    id: string;
    description: string | null;
    amount: number | null;
    category: string | null;
    status: string | null;
    receipt_url: string | null;
    submitted_at: string | null;
    approved_at: string | null;
    notes: string | null;
    employee_id: string | null;
    job_id: string | null;
    created_at: string;
  }>;

  const employees = (employeesRes.error?.code === "42P01" ? [] : employeesRes.data ?? []) as Array<{
    id: string;
    full_name: string | null;
  }>;

  return <ExpensesManager expenses={expenses} employees={employees} />;
}
