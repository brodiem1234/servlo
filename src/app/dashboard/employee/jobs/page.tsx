import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeJobsClient } from "./employee-jobs-client";

export const dynamic = "force-dynamic";

export default async function EmployeeJobsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as any)?.role !== "employee") redirect("/dashboard/owner");

  // Last 30 days + upcoming 60 days
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  const { data: jobs } = await sb
    .from("jobs")
    .select("id, title, status, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, notes, client_id, clients(full_name)")
    .eq("employee_id", user.id)
    .gte("scheduled_date", from.toISOString().slice(0, 10))
    .lte("scheduled_date", to.toISOString().slice(0, 10))
    .order("scheduled_date", { ascending: true });

  const jobsList = ((jobs ?? []) as unknown[]).map((j: any) => ({
    ...j,
    clients: Array.isArray(j.clients) ? (j.clients[0] ?? null) : j.clients,
  }));

  return <EmployeeJobsClient jobs={jobsList as any} />;
}


