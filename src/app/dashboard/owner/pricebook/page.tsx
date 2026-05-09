import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PricebookManager from "./pricebook-manager";

export const dynamic = "force-dynamic";

export default async function PricebookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: items, error } = await supabase
    .from("pricebook_items")
    .select("id, name, description, sku, unit_price, cost_price, unit, category, is_service, quantity_on_hand, reorder_threshold, is_active, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("name");

  const pricebookItems = error?.code === "42P01" ? [] : (items ?? []);
  const categories = [...new Set(pricebookItems.map((i: any) => i.category).filter(Boolean))].sort() as string[];

  return (
    <PricebookManager
      initialItems={pricebookItems as any[]}
      categories={categories}
    />
  );
}
