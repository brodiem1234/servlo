import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isIndustrySlug, type IndustrySlug } from "@/lib/industries";
import { loadWorkspaceFeatureSet } from "@/lib/workspace-features";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EmployeeDashboardClient } from "./employee-dashboard-client";

export const dynamic = "force-dynamic";

async function resolveEmployeeOwnerId(sb: SupabaseClient, userId: string, email: string | undefined) {
  const [{ data: jobOwner }, { data: empOwner }] = await Promise.all([
    sb.from("jobs").select("owner_id").eq("employee_id", userId).limit(1).maybeSingle(),
    email
      ? sb.from("employees").select("owner_id").eq("email", email).limit(1).maybeSingle()
      : Promise.resolve({ data: null })
  ]);
  return (jobOwner as any)?.owner_id ?? (empOwner as any)?.owner_id ?? null;
}

async function employeeWorkspaceHasGpsClock(sb: SupabaseClient, userId: string, email: string | undefined) {
  const ownerId = await resolveEmployeeOwnerId(sb, userId, email);
  if (!ownerId) return false;
  const { data: ownerProf } = await sb.from("profiles").select("industry_tags").eq("id", ownerId).maybeSingle();
  const tags = Array.isArray((ownerProf as { industry_tags?: unknown } | null)?.industry_tags)
    ? ((ownerProf as { industry_tags: string[] }).industry_tags ?? []).filter((t): t is IndustrySlug => isIndustrySlug(t))
    : [];
  const feats = await loadWorkspaceFeatureSet(sb, ownerId, tags);
  return feats.has("gps_clock");
}

export default async function EmployeeDashboardPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await sb.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if ((profile as any)?.role !== "employee") redirect("/dashboard/owner");

  const showGpsClock = await employeeWorkspaceHasGpsClock(sb, user.id, user.email ?? undefined);

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    { data: todayJobs },
    { data: weekJobs },
    { data: timesheets },
    { data: notifications },
    { data: openTimesheet },
  ] = await Promise.all([
    sb.from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, notes, client_id, clients(full_name)")
      .eq("employee_id", user.id)
      .eq("scheduled_date", todayKey)
      .order("scheduled_start", { ascending: true }),
    sb.from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start, address, suburb")
      .eq("employee_id", user.id)
      .gte("scheduled_date", weekStart.toISOString().slice(0, 10))
      .lt("scheduled_date", weekEnd.toISOString().slice(0, 10))
      .order("scheduled_date", { ascending: true }),
    sb.from("timesheets")
      .select("id, clock_in, clock_out, worked_hours, created_at")
      .eq("employee_id", user.id)
      .gte("created_at", weekStart.toISOString())
      .order("created_at", { ascending: false }),
    sb.from("owner_notifications")
      .select("id, title, body, type, read, created_at")
      .eq("owner_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5),
    sb.from("timesheets")
      .select("id, clock_in")
      .eq("employee_id", user.id)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1),
  ]);

  const weekHours = (timesheets ?? []).reduce((s: number, t: any) => s + Number(t.worked_hours ?? 0), 0);
  const isClockedIn = (openTimesheet ?? []).length > 0;

  async function clockInAction() {
    "use server";
    const sbA = await createClient();
    const { data: { user: emp } } = await sbA.auth.getUser();
    if (!emp) return;
    await sbA.from("timesheets").insert({ employee_id: emp.id, clock_in: new Date().toISOString() });
    revalidatePath("/dashboard/employee");
  }

  async function clockOutAction() {
    "use server";
    const sbA = await createClient();
    const { data: { user: emp } } = await sbA.auth.getUser();
    if (!emp) return;
    const { data: open } = await sbA
      .from("timesheets")
      .select("id, clock_in")
      .eq("employee_id", emp.id)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .maybeSingle();
    if (open) {
      const hours = (Date.now() - new Date((open as any).clock_in).getTime()) / (1000 * 60 * 60);
      await sbA
        .from("timesheets")
        .update({ clock_out: new Date().toISOString(), worked_hours: Number(hours.toFixed(2)) })
        .eq("id", (open as any).id);
    }
    revalidatePath("/dashboard/employee");
  }

  async function updateJobStatusAction(formData: FormData) {
    "use server";
    const sbA = await createClient();
    const { data: { user: emp } } = await sbA.auth.getUser();
    if (!emp) return;
    const jobId = String(formData.get("job_id") ?? "");
    const newStatus = String(formData.get("status") ?? "");
    if (!jobId || !newStatus) return;
    await sbA
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId)
      .eq("employee_id", emp.id);
    revalidatePath("/dashboard/employee");
  }

  const todayJobsList = ((todayJobs ?? []) as unknown[]).map((j: any) => ({
    ...j,
    clients: Array.isArray(j.clients) ? (j.clients[0] ?? null) : j.clients,
  })) as Array<{
    id: string;
    title: string | null;
    status: string | null;
    scheduled_date: string | null;
    scheduled_start: string | null;
    scheduled_end: string | null;
    address: string | null;
    suburb: string | null;
    state: string | null;
    notes: string | null;
    client_id: string | null;
    clients: { full_name: string | null } | null;
  }>;

  const weekJobsList = (weekJobs ?? []) as Array<{
    id: string;
    title: string | null;
    status: string | null;
    scheduled_date: string | null;
    scheduled_start: string | null;
    address: string | null;
    suburb: string | null;
  }>;

  const timesheetList = (timesheets ?? []) as Array<{
    id: string;
    clock_in: string | null;
    clock_out: string | null;
    worked_hours: number | null;
    created_at: string;
  }>;

  const notifList = (notifications ?? []) as Array<{
    id: string;
    title: string | null;
    body: string | null;
    type: string | null;
    read: boolean;
    created_at: string;
  }>;

  return (
    <EmployeeDashboardClient
      firstName={(profile as any)?.full_name?.split(" ")[0] ?? "there"}
      todayJobs={todayJobsList}
      weekJobs={weekJobsList}
      timesheets={timesheetList}
      notifications={notifList}
      weekHours={weekHours}
      isClockedIn={isClockedIn}
      showGpsClock={showGpsClock}
      clockInAction={clockInAction}
      clockOutAction={clockOutAction}
      updateJobStatusAction={updateJobStatusAction}
    />
  );
}
