import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("pricebook_items")
    .select("id, name, description, sku, unit_price, cost_price, supplier, unit, category, is_service, quantity_on_hand, reorder_threshold, is_active, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ items: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, description, sku, unit_price, cost_price, supplier, unit, category, is_service, quantity_on_hand, reorder_threshold, is_active } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (unit_price == null || isNaN(Number(unit_price))) return NextResponse.json({ error: "Valid unit_price required" }, { status: 400 });

  const { data, error } = await supabase
    .from("pricebook_items")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      description: description ?? null,
      sku: sku ?? null,
      unit_price: Number(unit_price),
      cost_price: cost_price != null ? Number(cost_price) : null,
      supplier: supplier ?? null,
      unit: unit ?? "each",
      category: category ?? null,
      is_service: is_service ?? false,
      quantity_on_hand: quantity_on_hand != null ? Number(quantity_on_hand) : null,
      reorder_threshold: reorder_threshold != null ? Number(reorder_threshold) : 5,
      is_active: is_active ?? true,
    })
    .select("id, name, description, sku, unit_price, cost_price, supplier, unit, category, is_service, quantity_on_hand, reorder_threshold, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Pricebook table not yet created. Apply migrations first." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
