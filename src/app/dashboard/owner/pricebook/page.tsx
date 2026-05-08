import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PricebookClient } from "./pricebook-client";

export const dynamic = "force-dynamic";

export default async function PricebookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: items } = await supabase
    .from("pricebook_items")
    .select("id, name, description, unit, unit_price, category, sku, taxable, is_active, created_at")
    .eq("owner_id", user.id)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  async function createItemAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const { error } = await sb.from("pricebook_items").insert({
      owner_id: owner.id,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      unit: String(formData.get("unit") ?? "").trim() || null,
      unit_price: Number(formData.get("unit_price") ?? 0),
      category: String(formData.get("category") ?? "").trim() || null,
      sku: String(formData.get("sku") ?? "").trim() || null,
      taxable: formData.get("taxable") === "true",
      is_active: true,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/pricebook");
  }

  async function updateItemAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const id = String(formData.get("id") ?? "");
    const { error } = await sb
      .from("pricebook_items")
      .update({
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        unit: String(formData.get("unit") ?? "").trim() || null,
        unit_price: Number(formData.get("unit_price") ?? 0),
        category: String(formData.get("category") ?? "").trim() || null,
        sku: String(formData.get("sku") ?? "").trim() || null,
        taxable: formData.get("taxable") === "true",
        is_active: formData.get("is_active") !== "false",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/pricebook");
  }

  async function deleteItemAction(formData: FormData): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const id = String(formData.get("id") ?? "");
    const { error } = await sb
      .from("pricebook_items")
      .delete()
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/pricebook");
  }

  async function importCsvAction(formData: FormData): Promise<{ ok: boolean; imported: number; errors: string[] }> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return { ok: false, imported: 0, errors: ["Not authenticated"] };

    const file = formData.get("csv") as File | null;
    if (!file) return { ok: false, imported: 0, errors: ["No file provided"] };

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { ok: false, imported: 0, errors: ["CSV must have a header row and at least one data row"] };

    // Parse header: name,description,unit,unit_price,category,sku,taxable
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    const nameIdx = header.indexOf("name");
    const priceIdx = header.findIndex((h) => h.includes("price") || h.includes("unit_price"));
    if (nameIdx === -1) return { ok: false, imported: 0, errors: ["CSV must have a 'name' column"] };

    const rows = [];
    const errors: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = cols[nameIdx]?.trim();
      if (!name) { errors.push(`Row ${i + 1}: missing name`); continue; }
      const unit_price = priceIdx >= 0 ? Number(cols[priceIdx] ?? 0) : 0;
      rows.push({
        owner_id: owner.id,
        name,
        description: header.indexOf("description") >= 0 ? (cols[header.indexOf("description")] || null) : null,
        unit: header.indexOf("unit") >= 0 ? (cols[header.indexOf("unit")] || null) : null,
        unit_price: isNaN(unit_price) ? 0 : unit_price,
        category: header.indexOf("category") >= 0 ? (cols[header.indexOf("category")] || null) : null,
        sku: header.indexOf("sku") >= 0 ? (cols[header.indexOf("sku")] || null) : null,
        taxable: true,
        is_active: true,
      });
    }

    if (rows.length === 0) return { ok: false, imported: 0, errors };

    const { error } = await sb.from("pricebook_items").insert(rows);
    if (error) return { ok: false, imported: 0, errors: [error.message] };

    revalidatePath("/dashboard/owner/pricebook");
    return { ok: true, imported: rows.length, errors };
  }

  return (
    <PricebookClient
      initialItems={items ?? []}
      createAction={createItemAction}
      updateAction={updateItemAction}
      deleteAction={deleteItemAction}
      importCsvAction={importCsvAction}
    />
  );
}
