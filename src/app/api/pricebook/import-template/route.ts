import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { trade, overwrite = false } = await req.json();
  if (!trade) return NextResponse.json({ error: "trade is required" }, { status: 400 });

  // Load templates for this trade
  const { data: templates, error: tErr } = await supabase
    .from("pricebook_templates")
    .select("name, description, unit_price, unit, category, is_service")
    .eq("trade", trade);

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  if (!templates || templates.length === 0) {
    return NextResponse.json({ error: `No templates found for trade: ${trade}` }, { status: 404 });
  }

  if (overwrite) {
    // Delete existing non-demo items
    await supabase
      .from("pricebook_items")
      .delete()
      .eq("owner_id", user.id)
      .is("deleted_at", null);
  }

  // Get existing item names to avoid duplicates
  const { data: existing } = await supabase
    .from("pricebook_items")
    .select("name")
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  const existingNames = new Set((existing ?? []).map((i: { name: string }) => i.name.toLowerCase()));

  const toInsert = templates
    .filter((t) => !existingNames.has(t.name.toLowerCase()))
    .map((t) => ({
      owner_id: user.id,
      name: t.name,
      description: t.description,
      unit_price: t.unit_price,
      unit: t.unit,
      category: t.category,
      is_service: t.is_service,
      is_active: true,
      is_demo: false,
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ imported: 0, skipped: templates.length, message: "All items already exist in your pricebook." });
  }

  const { error: insErr } = await supabase.from("pricebook_items").insert(toInsert);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({
    imported: toInsert.length,
    skipped: templates.length - toInsert.length,
  });
}
