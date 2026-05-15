import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeJobsClient } from "./employee-jobs-client";

export const dynamic = "force-dynamic";

export default async function EmployeeJobsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string | null } | null)?.role !== "employee") {
    redirect("/dashboard/owner");
  }

  // jobs.employee_id is the employees.id UUID, NOT auth.users.id.
  // Look up the employee's row via profile_id (links to auth user) so we can
  // filter jobs correctly. Previously this filter was `employee_id = user.id`
  // which never matched and showed every employee an empty list.
  const { data: employeeRow } = await sb
    .from("employees")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const employeeId = (employeeRow as { id?: string } | null)?.id ?? null;

  // No linked employee row → nothing to show. Render the empty state rather
  // than crashing.
  if (!employeeId) {
    return <EmployeeJobsClient jobs={[] as Parameters<typeof EmployeeJobsClient>[0]["jobs"]} />;
  }

  // Last 30 days + upcoming 60 days
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  const { data: jobs } = await sb
    .from("jobs")
    .select(
      "id, title, status, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, notes, client_id, clients(full_name)"
    )
    .eq("employee_id", employeeId)
    .gte("scheduled_date", from.toISOString().slice(0, 10))
    .lte("scheduled_date", to.toISOString().slice(0, 10))
    .order("scheduled_date", { ascending: true });

  const jobsList = ((jobs ?? []) as unknown[]).map((j) => {
    const job = j as { clients?: unknown };
    return {
      ...(j as Record<string, unknown>),
      clients: Array.isArray(job.clients) ? (job.clients[0] ?? null) : job.clients,
    };
  });

  return <EmployeeJobsClient jobs={jobsList as Parameters<typeof EmployeeJobsClient>[0]["jobs"]} />;
}
