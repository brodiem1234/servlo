/**
 * POST /api/jobs/smart-schedule
 * Suggests the best available time slots for a job based on team availability.
 * Body: { employee_id?, job_duration_hours?, preferred_date?, suburb? }
 * Returns: { slots: Array<{ date, start, end, employee_id, employee_name, score, reason }> }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

function addHours(dateStr: string, timeStr: string, hours: number): string {
  const [h, m] = (timeStr || "09:00").split(":").map(Number);
  const total = h * 60 + (m || 0) + Math.round(hours * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

// Generate weekdays starting from `fromDate`
function nextWeekdays(from: Date, count: number): Date[] {
  const result: Date[] = [];
  const d = new Date(from);
  while (result.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

const WORK_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    employee_id?: string;
    job_duration_hours?: number;
    preferred_date?: string;
    suburb?: string;
  };

  const durationHours = Math.max(0.5, Math.min(12, Number(body.job_duration_hours ?? 2)));
  const preferredDate = body.preferred_date ? new Date(body.preferred_date) : new Date();

  // Fetch employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, status")
    .eq("owner_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null);

  const targetEmployees = body.employee_id
    ? (employees ?? []).filter((e) => e.id === body.employee_id)
    : (employees ?? []).slice(0, 5); // Check up to 5 employees

  // Look-ahead window: next 5 weekdays
  const lookAheadDays = nextWeekdays(preferredDate, 5);

  // Fetch existing jobs for those days to detect conflicts
  const fromDate = lookAheadDays[0].toISOString().slice(0, 10);
  const toDate = lookAheadDays[lookAheadDays.length - 1].toISOString().slice(0, 10);

  const { data: existingJobs } = await supabase
    .from("jobs")
    .select("employee_id, scheduled_date, scheduled_start, scheduled_end, status")
    .eq("owner_id", user.id)
    .gte("scheduled_date", fromDate)
    .lte("scheduled_date", toDate)
    .not("status", "eq", "cancelled")
    .is("deleted_at", null);

  const jobsByEmployeeDate = new Map<string, Array<{ start: string; end: string }>>();
  for (const j of existingJobs ?? []) {
    if (!j.employee_id || !j.scheduled_date || !j.scheduled_start) continue;
    const key = `${j.employee_id}:${j.scheduled_date}`;
    const arr = jobsByEmployeeDate.get(key) ?? [];
    arr.push({ start: j.scheduled_start, end: j.scheduled_end ?? addHours(j.scheduled_date, j.scheduled_start, 2) });
    jobsByEmployeeDate.set(key, arr);
  }

  function hasConflict(empId: string, dateStr: string, slotStart: string, durationHrs: number): boolean {
    const key = `${empId}:${dateStr}`;
    const existingSlots = jobsByEmployeeDate.get(key) ?? [];
    const [sh, sm] = slotStart.split(":").map(Number);
    const slotStartMins = sh * 60 + sm;
    const slotEndMins = slotStartMins + Math.round(durationHrs * 60);
    for (const es of existingSlots) {
      const [eh, em] = es.start.split(":").map(Number);
      const [eeh, eem] = es.end.split(":").map(Number);
      const existStartMins = eh * 60 + em;
      const existEndMins = eeh * 60 + eem;
      if (slotStartMins < existEndMins && slotEndMins > existStartMins) return true;
    }
    return false;
  }

  type Slot = {
    date: string;
    date_label: string;
    start: string;
    end: string;
    employee_id: string;
    employee_name: string;
    score: number;
    reason: string;
  };

  const slots: Slot[] = [];

  for (const day of lookAheadDays) {
    const dateStr = day.toISOString().slice(0, 10);
    const label = dateLabel(day);
    const isPreferred = body.preferred_date && dateStr === body.preferred_date.slice(0, 10);

    for (const emp of targetEmployees) {
      const empName = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || "Team member";
      const key = `${emp.id}:${dateStr}`;
      const dayJobCount = (jobsByEmployeeDate.get(key) ?? []).length;

      for (const slotStart of WORK_SLOTS) {
        // Skip past times for today
        if (dateStr === new Date().toISOString().slice(0, 10)) {
          const [sh] = slotStart.split(":").map(Number);
          if (sh <= new Date().getHours()) continue;
        }

        if (!hasConflict(emp.id, dateStr, slotStart, durationHours)) {
          const slotEnd = addHours(dateStr, slotStart, durationHours);

          // Score: prefer morning, low existing load, preferred date
          const [sh] = slotStart.split(":").map(Number);
          let score = 80;
          if (sh === 8 || sh === 9) score += 10; // Morning premium
          if (dayJobCount === 0) score += 8;
          else if (dayJobCount === 1) score += 4;
          if (isPreferred) score += 15;

          let reason = `${empName} is free on ${label} at ${slotStart}`;
          if (dayJobCount === 0) reason += " — no other jobs that day";
          else reason += ` — ${dayJobCount} other job${dayJobCount !== 1 ? "s" : ""} scheduled`;

          slots.push({
            date: dateStr,
            date_label: label,
            start: slotStart,
            end: slotEnd,
            employee_id: emp.id,
            employee_name: empName,
            score,
            reason,
          });

          if (slots.length >= 20) break; // Limit initial generation
        }
      }
      if (slots.length >= 20) break;
    }
    if (slots.length >= 20) break;
  }

  // Sort by score desc, take top 8
  const topSlots = slots
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return NextResponse.json({ slots: topSlots, duration_hours: durationHours });
}
