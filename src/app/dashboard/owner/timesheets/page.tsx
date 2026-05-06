import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import OwnerTimesheetsClient from "./owner-timesheets-client";
import { filterDemoEntities } from "@/lib/demo/visibility";

export const dynamic = "force-dynamic";

function mondayOfWeek(containing: Date) {
  const d = new Date(containing);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type TimesheetsProps = {
  searchParams?: Promise<{ week?: string }>;
};

export default async function OwnerTimesheetsPage({ searchParams }: TimesheetsProps) {
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "timesheets");

  const sp = (await searchParams) ?? {};
  const weekRaw = typeof sp.week === "string" ? sp.week.trim() : "";
  const anchor =
    weekRaw && /^\d{4}-\d{2}-\d{2}$/.test(weekRaw) ? new Date(`${weekRaw}T12:00:00`) : new Date();
  const mon = mondayOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(x.getDate() + i);
    return x;
  });
  const weekStartIso = iso(mon);
  const weekEndIso = iso(days[6]);

  const { data: employees } = await sb
    .from("employees")
    .select("id, full_name, email, role, is_demo")
    .eq("owner_id", user.id)
    .order("full_name", { ascending: true });

  const visibleEmployees = filterDemoEntities(employees ?? []).filter((e: { role?: string | null }) => {
    const r = (e.role ?? "employee").toLowerCase();
    return r === "employee" || r === "contractor";
  });

  const empIds = visibleEmployees.map((e: { id: string }) => e.id);
  const { data: entriesRaw } =
    empIds.length === 0
      ? { data: [] as Array<{ employee_id: string; work_date: string; hours: number | string | null }> }
      : await sb
          .from("timesheet_entries")
          .select("employee_id, work_date, hours")
          .eq("owner_id", user.id)
          .gte("work_date", weekStartIso)
          .lte("work_date", weekEndIso)
          .in("employee_id", empIds);

  const entries = entriesRaw ?? [];
  const hourLookup = new Map<string, number>();
  for (const row of entries) {
    hourLookup.set(`${row.employee_id}|${String(row.work_date).slice(0, 10)}`, Number(row.hours ?? 0));
  }

  async function saveHoursAction(formData: FormData) {
    "use server";
    const sb2 = await createClient();
    const {
      data: { user: owner }
    } = await sb2.auth.getUser();
    if (!owner) redirect("/auth/login");
    const employee_id = String(formData.get("employee_id") ?? "");
    const work_date = String(formData.get("work_date") ?? "").slice(0, 10);
    const hours = Number(formData.get("hours") ?? 0);
    if (!employee_id || !work_date) return;

    const { error } = await sb2.from("timesheet_entries").upsert(
      {
        owner_id: owner.id,
        employee_id,
        work_date,
        hours: Number.isFinite(hours) ? hours : 0
      },
      { onConflict: "employee_id,work_date" }
    );
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/timesheets");
  }

  const prevWeek = new Date(mon);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(mon);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Timesheets</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Week of {mon.toLocaleDateString("en-AU")} — edit hours per employee per day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href={`/dashboard/owner/timesheets?week=${iso(prevWeek)}`}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-[var(--text-primary)]"
          >
            Previous week
          </a>
          <a
            href={`/dashboard/owner/timesheets?week=${iso(nextWeek)}`}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-[var(--text-primary)]"
          >
            Next week
          </a>
        </div>
      </div>

      <OwnerTimesheetsClient
        weekStartIso={weekStartIso}
        daysIso={days.map((d) => iso(d))}
        dayLabels={days.map((d) => d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric" }))}
        employees={visibleEmployees.map((e: { id: string; full_name: string | null }) => ({
          id: e.id,
          label: e.full_name ?? "Employee"
        }))}
        hourLookup={Object.fromEntries(hourLookup)}
        saveHoursAction={saveHoursAction}
      />
    </section>
  );
}
