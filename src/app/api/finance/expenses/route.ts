import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase
    .from("expense_claims")
    .select("id, description, amount, status, expense_date, category")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false });
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ expenses: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { description, amount, expense_date, category } = body;
  if (!description?.trim()) return NextResponse.json({ error: "Description required" }, { status: 400 });
  const { data, error } = await supabase
    .from("expense_claims")
    .insert({
      owner_id: user.id,
      description: description.trim(),
      amount: Number(amount) || 0,
      expense_date: expense_date || new Date().toISOString().slice(0, 10),
      category: category || null,
      status: "pending",
    })
    .select("id, description, amount, status, expense_date, category")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ expense: data }, { status: 201 });
}
