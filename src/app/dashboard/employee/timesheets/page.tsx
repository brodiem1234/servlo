import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export default async function EmployeeTimesheetsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  // Last 4 weeks
  const from = new Date();
  from.setDate(from.getDate() - 28);

  const { data: rows } = await sb
    .from("timesheets")
    .select("id, clock_in, clock_out, worked_hours, created_at")
    .eq("employee_id", user.id)
    .gte("created_at", from.toISOString())
    .order("clock_in", { ascending: false });

  const entries = (rows ?? []) as Array<{
    id: string;
    clock_in: string;
    clock_out: string | null;
    worked_hours: number | null;
    created_at: string;
  }>;

  const totalHours = entries.reduce((s, e) => s + Number(e.worked_hours ?? 0), 0);
  const completedEntries = entries.filter((e) => e.clock_out != null);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Hours</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Last 4 weeks · {completedEntries.length} shifts · {totalHours.toFixed(1)} hrs total
        </p>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{totalHours.toFixed(1)}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Total hours</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{completedEntries.length}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Shifts</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {completedEntries.length > 0 ? (totalHours / completedEntries.length).toFixed(1) : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Avg/shift</p>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-3xl mb-2">⏱️</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>No entries yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Use the Home tab to clock in and out</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {fmtDate(e.clock_in)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {fmtTime(e.clock_in)}
                  {e.clock_out ? ` – ${fmtTime(e.clock_out)}` : " · clocked in"}
                </p>
              </div>
              <div className="text-right">
                {e.worked_hours != null ? (
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {Number(e.worked_hours).toFixed(2)}h
                  </p>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 px-2 py-1 rounded-full bg-emerald-50">Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center pb-2" style={{ color: "var(--text-muted)" }}>
        Contact your manager to correct any errors.
      </p>
    </section>
  );
}
