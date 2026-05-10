import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await sb
    .from("expense_claims")
    .select("*")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ expenses: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data });
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

  const insertData: Record<string, unknown> = {
    owner_id: user.id,
    description,
    amount,
    category: String(body.category ?? "Other").trim() || "Other",
    notes: body.notes ? String(body.notes).trim() : null,
    employee_id: body.employee_id ? String(body.employee_id) : null,
    job_id: body.job_id ? String(body.job_id) : null,
    submitted_at: body.submitted_at ? String(body.submitted_at) : new Date().toISOString().slice(0, 10),
    status: "pending",
  };

  const { data, error } = await sb
    .from("expense_claims")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Expense claims table not set up yet" }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
