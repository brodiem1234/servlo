import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ClockBody {
  action: "clock_in" | "clock_out";
  job_id?: string;
  lat: number;
  lng: number;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ClockBody;
  try {
    body = (await req.json()) as ClockBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, job_id, lat, lng } = body;

  if (action !== "clock_in" && action !== "clock_out") {
    return NextResponse.json({ error: "action must be clock_in or clock_out" }, { status: 400 });
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng are required numbers" }, { status: 400 });
  }

  if (action === "clock_in") {
    const { data, error } = await supabase
      .from("timesheets")
      .insert({
        employee_id: user.id,
        clock_in: new Date().toISOString(),
        ...(job_id ? { job_id } : {}),
        notes: "Auto geofence clock-in",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "clock_in", timesheet_id: data.id });
  }

  // clock_out: find most recent open timesheet for this employee
  const { data: openSheet, error: findError } = await supabase
    .from("timesheets")
    .select("id, clock_in")
    .eq("employee_id", user.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!openSheet) {
    return NextResponse.json({ error: "No open timesheet found" }, { status: 404 });
  }

  const clockOutTime = new Date();
  const clockInTime = new Date(openSheet.clock_in as string);
  const totalHours = Number(
    ((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(2)
  );

  const { error: updateError } = await supabase
    .from("timesheets")
    .update({
      clock_out: clockOutTime.toISOString(),
      total_hours: totalHours,
    })
    .eq("id", openSheet.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    action: "clock_out",
    timesheet_id: openSheet.id,
    total_hours: totalHours,
  });
}
