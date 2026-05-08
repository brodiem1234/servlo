import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/pricebook
 * Returns active pricebook items for the authenticated owner.
 * Used by quote and invoice line-item forms to populate item picker.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("pricebook_items")
      .select("id, name, description, unit, unit_price, category, sku, taxable")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("[pricebook GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
