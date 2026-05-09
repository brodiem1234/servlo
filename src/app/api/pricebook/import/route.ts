import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  if (items.length > 500) {
    return NextResponse.json({ error: "Maximum 500 items per import" }, { status: 400 });
  }

  const rows = items.map((item: Record<string, unknown>) => ({
    owner_id: user.id,
    name: String(item.name ?? "").trim(),
    description: item.description ? String(item.description) : null,
    sku: item.sku ? String(item.sku).trim() : null,
    type: item.type === "product" ? "product" : "service",
    unit_price: parseFloat(String(item.unit_price ?? 0)) || 0,
    cost_price: parseFloat(String(item.cost_price ?? 0)) || 0,
    unit: item.unit ? String(item.unit) : "each",
    category: item.category ? String(item.category) : null,
    track_stock: item.type === "product" && Boolean(item.track_stock),
    stock_qty: item.track_stock ? (parseInt(String(item.stock_qty ?? 0)) || 0) : null,
    low_stock_threshold: item.track_stock ? (parseInt(String(item.low_stock_threshold ?? 5)) || 5) : null,
    active: item.active !== false,
  }));

  const { data, error } = await supabase
    .from("pricebook_items")
    .insert(rows)
    .select("id");

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ error: "Pricebook table not ready. Apply migrations first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: data?.length ?? rows.length,
    skipped: 0,
    errors: [],
  }, { status: 201 });
}
