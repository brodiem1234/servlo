import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function padDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

export default async function EmployeeTimesheetsPage() {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user?.email) redirect("/auth/login");

  const today = new Date();
  const monday = startOfWeekMonday(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return padDate(d);
  });

  const start = weekDates[0]!;
  const end = weekDates[6]!;

  const { data: rows, error } = await sb
    .from("timesheet_entries")
    .select("work_date, hours, notes")
    .gte("work_date", start)
    .lte("work_date", end)
    .order("work_date", { ascending: true });

  const byDate = new Map((rows ?? []).map((r) => [r.work_date as string, r]));

  const weekLabel = `${start} → ${end}`;
  const totalHours = (rows ?? []).reduce((acc, r) => acc + Number(r.hours ?? 0), 0);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">My timesheets</h1>
        <p className="text-[var(--text-muted)]">
          Hours recorded for you this week ({weekLabel}). Totals: <strong className="text-[var(--text-primary)]">{totalHours.toFixed(2)}</strong> h.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Could not load timesheets ({error.message}). If this persists, the database may still be updating.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-sm">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
              <th className="px-3 py-2 font-medium">Day</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Hours</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {weekDates.map((iso) => {
              const d = new Date(`${iso}T12:00:00`);
              const row = byDate.get(iso);
              const label = d.toLocaleDateString("en-AU", { weekday: "short" });
              return (
                <tr key={iso} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{label}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{iso}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{row ? Number(row.hours).toFixed(2) : "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{row?.notes?.trim() ? row.notes : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Entries are read-only here and scoped by your login email. Ask your business owner to correct mistakes.
      </p>
    </section>
  );
}
