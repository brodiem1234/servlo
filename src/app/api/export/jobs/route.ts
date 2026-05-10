import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: jobData, error: jobError }, { data: clientData }] = await Promise.all([
    supabase
      .from("jobs")
      .select("title, status, scheduled_date, scheduled_time, address, notes, client_id, created_at")
      .eq("owner_id", user.id)
      .eq("is_demo", false)
      .is("deleted_at", null)
      .order("scheduled_date", { ascending: false }),
    supabase.from("clients").select("id, full_name").eq("owner_id", user.id).is("deleted_at", null)
  ]);

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  const clientNameById = new Map(
    (clientData ?? []).map((c: { id: string; full_name: string | null }) => [c.id, c.full_name ?? ""])
  );

  const header = "Title,Status,ClientName,ScheduledDate,ScheduledTime,Address,Notes,CreatedAt";
  const rows = (jobData ?? []).map((r) =>
    [
      JSON.stringify(r.title ?? ""),
      JSON.stringify(r.status ?? ""),
      JSON.stringify(r.client_id ? (clientNameById.get(r.client_id) ?? "") : ""),
      JSON.stringify(r.scheduled_date ?? ""),
      JSON.stringify(r.scheduled_time ?? ""),
      JSON.stringify(r.address ?? ""),
      JSON.stringify(r.notes ?? ""),
      JSON.stringify(r.created_at ?? "")
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="servlo-jobs.csv"`
    }
  });
}
