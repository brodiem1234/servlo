import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import OwnerEmployeesPage from "../employees/page";
import OwnerTimesheetsPage from "../timesheets/page";
import { createClient } from "@/lib/supabase/server";
import { TeamPerformance } from "./team-performance";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

async function safeFetch<T>(
  fn: () => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>
): Promise<T[]> {
  const { data, error } = await fn();
  if (error) { if (error.code !== "42P01") console.error("[team]", error.message); return []; }
  return data ?? [];
}

export default async function TeamPage({ searchParams }: Props) {
  const { enabled } = await requireOwnerWorkspaceFeatures();

  const availableTabs = [
    enabled.has("employee_management") && { id: "employees",    label: "Employees" },
    enabled.has("timesheets")          && { id: "timesheets",   label: "Timesheets" },
    enabled.has("employee_management") && { id: "performance",  label: "Performance" },
    enabled.has("contractors")         && { id: "contractors",  label: "Contractors" },
  ].filter(Boolean) as { id: string; label: string }[];

  if (availableTabs.length === 0) redirect("/dashboard/owner");

  const sp = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const rawTab = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const activeTab = availableTabs.find((t) => t.id === rawTab) ? rawTab! : availableTabs[0].id;

  if (activeTab === "contractors") redirect("/dashboard/contractors");

  // Only fetch data for Performance tab
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let employees: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let timesheets: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jobs: any[] = [];

  if (activeTab === "performance") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      [employees, timesheets, jobs] = await Promise.all([
        safeFetch(() =>
          supabase.from("employees")
            .select("id, full_name, email, role, status, hourly_rate, created_at")
            .eq("owner_id", user.id)
            .is("deleted_at", null)
            .order("full_name")
        ),
        safeFetch(() =>
          supabase.from("timesheets")
            .select("id, employee_id, clock_in, clock_out, total_hours, date, notes")
            .eq("owner_id", user.id)
            .is("deleted_at", null)
            .gte("clock_in", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        ),
        safeFetch(() =>
          supabase.from("jobs")
            .select("id, assigned_to, status, scheduled_start")
            .eq("owner_id", user.id)
            .is("deleted_at", null)
            .gte("scheduled_start", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        ),
      ]);
    }
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 border-b border-[var(--border)]">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Team
        </h1>
        <div className="flex gap-1 flex-wrap">
          {availableTabs.map((t) => (
            <Link
              key={t.id}
              href={
                t.id === "contractors"
                  ? "/dashboard/contractors"
                  : `/dashboard/owner/team?tab=${t.id}`
              }
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "border-[#3B82F6] text-[#3B82F6]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Active tab content */}
      {activeTab === "employees"   && <OwnerEmployeesPage />}
      {activeTab === "timesheets"  && <OwnerTimesheetsPage />}
      {activeTab === "performance" && (
        <TeamPerformance
          employees={employees as Parameters<typeof TeamPerformance>[0]["employees"]}
          timesheets={timesheets as Parameters<typeof TeamPerformance>[0]["timesheets"]}
          jobs={jobs as Parameters<typeof TeamPerformance>[0]["jobs"]}
        />
      )}
    </div>
  );
}
