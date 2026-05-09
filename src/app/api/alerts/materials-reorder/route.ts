import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MaterialAlert {
  id: string;
  name: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  unit: string;
}

const STUB_ALERTS: MaterialAlert[] = [
  { id: "1", name: "PVC Fittings 25mm", quantity_on_hand: 3, reorder_threshold: 10, unit: "pack" },
  { id: "2", name: "Teflon Tape", quantity_on_hand: 1, reorder_threshold: 5, unit: "roll" },
];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: items, error } = await supabase
      .from("pricebook_items")
      .select("id, name, quantity_on_hand, reorder_threshold, unit")
      .eq("owner_id", user.id)
      .is("deleted_at", null);

    // If the table or columns don't exist, fall through to stub
    if (error) {
      return NextResponse.json({ alerts: STUB_ALERTS, stub: true });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ alerts: STUB_ALERTS, stub: true });
    }

    // Filter items needing reorder
    const alerts: MaterialAlert[] = items
      .filter((item) => {
        const qty = item.quantity_on_hand as number | null;
        const threshold = item.reorder_threshold as number | null;
        if (typeof qty !== "number") return false;
        if (typeof threshold === "number") {
          return qty <= threshold;
        }
        // Fallback: flag if less than 5 in stock
        return qty < 5;
      })
      .map((item) => ({
        id: String(item.id),
        name: String(item.name ?? "Unknown item"),
        quantity_on_hand: Number(item.quantity_on_hand ?? 0),
        reorder_threshold: Number(item.reorder_threshold ?? 5),
        unit: String(item.unit ?? "unit"),
      }));

    return NextResponse.json({ alerts, stub: false });
  } catch {
    // Graceful degradation: return stub if anything unexpected happens
    return NextResponse.json({ alerts: STUB_ALERTS, stub: true });
  }
}
