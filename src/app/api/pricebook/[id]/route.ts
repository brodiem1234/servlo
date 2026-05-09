import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, description, sku, unit_price, cost_price, unit, category, is_service, quantity_on_hand, reorder_threshold, is_active } = body;

  const { data, error } = await supabase
    .from("pricebook_items")
    .update({
      name: name?.trim(),
      description: description ?? null,
      sku: sku ?? null,
      unit_price: unit_price != null ? Number(unit_price) : undefined,
      cost_price: cost_price != null ? Number(cost_price) : null,
      unit: unit ?? "each",
      category: category ?? null,
      is_service: is_service ?? false,
      quantity_on_hand: quantity_on_hand != null ? Number(quantity_on_hand) : null,
      reorder_threshold: reorder_threshold != null ? Number(reorder_threshold) : 5,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id, name, description, sku, unit_price, cost_price, unit, category, is_service, quantity_on_hand, reorder_threshold, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { error } = await supabase
    .from("pricebook_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
