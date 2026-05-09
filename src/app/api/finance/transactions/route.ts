import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase
    .from("bank_transactions")
    .select("id, date, description, amount, category, reconciled, source, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(50);
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ transactions: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { date, description, amount, category } = body;
  if (!description?.trim()) return NextResponse.json({ error: "Description required" }, { status: 400 });
  if (amount == null || isNaN(Number(amount))) return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
  const { data, error } = await supabase
    .from("bank_transactions")
    .insert({
      owner_id: user.id,
      date: date || new Date().toISOString().slice(0, 10),
      description: description.trim(),
      amount: Number(amount),
      category: category || null,
      source: "manual",
    })
    .select("id, date, description, amount, category, reconciled, source")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ transaction: data }, { status: 201 });
}
