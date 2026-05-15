import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertSubscriptionActive } from "@/lib/pause-check";

export const dynamic = "force-dynamic";

// GET /api/invoices/[id]/payments — List payments for an invoice
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Verify invoice ownership
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: payments, error } = await supabase
    .from("invoice_payments")
    .select("id, amount, payment_date, payment_method, reference, notes, created_at")
    .eq("invoice_id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false });

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ payments: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payments: payments ?? [] });
}

// POST /api/invoices/[id]/payments — Record a partial payment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const subBlock = await assertSubscriptionActive(user.id);
  if (subBlock) return subBlock;

  const body = await req.json().catch(() => ({}));
  const { amount, payment_date, payment_method, reference, notes } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
  }

  // Verify invoice ownership and get current total + amount_paid
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total, amount_paid, status")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const invoiceTotal = parseFloat(String(invoice.total ?? 0));
  const alreadyPaid = parseFloat(String(invoice.amount_paid ?? 0));
  const newAmount = parseFloat(String(amount));
  const newPaidTotal = alreadyPaid + newAmount;

  // Insert payment record
  const { data: payment, error: payError } = await supabase
    .from("invoice_payments")
    .insert({
      owner_id: user.id,
      invoice_id: id,
      amount: newAmount,
      payment_date: payment_date ?? new Date().toISOString().split("T")[0],
      payment_method: payment_method ?? "bank_transfer",
      reference: reference ?? null,
      notes: notes ?? null,
    })
    .select("id, amount, payment_date, payment_method, reference, notes, created_at")
    .single();

  if (payError) {
    if (payError.code === "42P01") return NextResponse.json({ error: "Payments table not ready" }, { status: 503 });
    return NextResponse.json({ error: payError.message }, { status: 500 });
  }

  // Update invoice amount_paid and possibly status
  const newStatus = newPaidTotal >= invoiceTotal ? "paid" : String(invoice.status ?? "sent");
  await supabase
    .from("invoices")
    .update({ amount_paid: newPaidTotal, status: newStatus })
    .eq("id", id)
    .eq("owner_id", user.id);

  return NextResponse.json({ payment, amount_paid: newPaidTotal, status: newStatus }, { status: 201 });
}

// DELETE /api/invoices/[id]/payments — Soft-delete a payment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const { data: payment } = await supabase
    .from("invoice_payments")
    .select("id, amount")
    .eq("id", paymentId)
    .eq("invoice_id", invoiceId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const { error } = await supabase
    .from("invoice_payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate amount_paid on the invoice
  const { data: remaining } = await supabase
    .from("invoice_payments")
    .select("amount")
    .eq("invoice_id", invoiceId)
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  const newPaidTotal = (remaining ?? []).reduce((s, p) => s + parseFloat(String(p.amount ?? 0)), 0);

  await supabase
    .from("invoices")
    .update({ amount_paid: newPaidTotal })
    .eq("id", invoiceId)
    .eq("owner_id", user.id);

  return NextResponse.json({ ok: true, amount_paid: newPaidTotal });
}
