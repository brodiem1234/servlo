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

  const [{ data: invData, error: invError }, { data: clientData }] = await Promise.all([
    supabase
      .from("invoices")
      .select("invoice_number, status, total, subtotal, gst, due_date, issue_date, notes, client_id")
      .eq("owner_id", user.id)
      .eq("is_demo", false)
      .is("deleted_at", null)
      .order("due_date", { ascending: false }),
    supabase.from("clients").select("id, full_name").eq("owner_id", user.id).is("deleted_at", null)
  ]);

  if (invError) {
    return NextResponse.json({ error: invError.message }, { status: 500 });
  }

  const clientNameById = new Map(
    (clientData ?? []).map((c: { id: string; full_name: string | null }) => [c.id, c.full_name ?? ""])
  );

  const header = "ContactName,InvoiceNumber,IssueDate,DueDate,Subtotal,GST,Total,Status,Notes";
  const rows = (invData ?? []).map((r) =>
    [
      JSON.stringify(r.client_id ? (clientNameById.get(r.client_id) ?? "") : ""),
      JSON.stringify(r.invoice_number ?? ""),
      JSON.stringify(r.issue_date ?? ""),
      JSON.stringify(r.due_date ?? ""),
      r.subtotal ?? 0,
      r.gst ?? 0,
      r.total ?? 0,
      JSON.stringify(r.status ?? ""),
      JSON.stringify(r.notes ?? "")
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="servlo-invoices.csv"`
    }
  });
}
