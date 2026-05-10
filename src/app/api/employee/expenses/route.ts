import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Employee submits their own expense claim — owner_id resolved from job assignment. */
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await sb
    .from("expense_claims")
    .select("id, description, amount, category, notes, status, submitted_at, created_at, receipt_url")
    .eq("employee_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ expenses: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description = String(body.description ?? "").trim();
  if (!description) return NextResponse.json({ error: "Description is required" }, { status: 422 });

  const amount = parseFloat(String(body.amount ?? "0"));
  if (isNaN(amount) || amount < 0) return NextResponse.json({ error: "Invalid amount" }, { status: 422 });

  // Resolve owner_id from the employee's job assignments
  const { data: jobOwner } = await sb
    .from("jobs")
    .select("owner_id")
    .eq("employee_id", user.id)
    .limit(1)
    .maybeSingle();

  let ownerId: string | undefined = (jobOwner as any)?.owner_id;

  if (!ownerId) {
    // fallback: check employees table
    const { data: empRow } = await sb
      .from("employees")
      .select("owner_id")
      .eq("email", user.email ?? "")
      .limit(1)
      .maybeSingle();
    ownerId = (empRow as any)?.owner_id;
    if (!ownerId) {
      return NextResponse.json({ error: "Cannot determine owner for this employee" }, { status: 422 });
    }
  }

  const { data, error } = await sb
    .from("expense_claims")
    .insert({
      owner_id: ownerId,
      employee_id: user.id,
      description,
      amount,
      category: String(body.category ?? "Other").trim() || "Other",
      notes: body.notes ? String(body.notes).trim() : null,
      job_id: body.job_id ? String(body.job_id) : null,
      submitted_at: new Date().toISOString().slice(0, 10),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Expense claims not configured yet" }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
