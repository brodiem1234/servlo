import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      "id, invoice_id, amount, currency, payment_method, status, fee_amount, net_amount, paid_at, description, created_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("paid_at", { ascending: false })
    .limit(50);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ transactions: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { invoice_id, amount, payment_method, description } = body;

  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
  }

  const amt = Number(amount);
  const fee = Math.round((amt * 0.022 + 0.3) * 100) / 100;
  const net = Math.round((amt - fee) * 100) / 100;

  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      owner_id: user.id,
      invoice_id: invoice_id || null,
      amount: amt,
      currency: "AUD",
      payment_method: payment_method || "card",
      status: "succeeded",
      fee_amount: fee,
      net_amount: net,
      paid_at: new Date().toISOString(),
      description: description || null,
    })
    .select(
      "id, amount, payment_method, status, fee_amount, net_amount, paid_at, description"
    )
    .single();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Table not ready. Apply migrations." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transaction: data }, { status: 201 });
}
