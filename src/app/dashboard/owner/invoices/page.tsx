import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import InvoicesManager from "./invoices-manager";

function getNextNumber(existing: Array<{ invoice_number: string | null }>, prefix: string) {
  const max = existing.reduce((highest, item) => {
    const value = item.invoice_number ?? "";
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(value);
    if (!match) return highest;
    const num = Number(match[1]);
    return Number.isFinite(num) ? Math.max(highest, num) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export default async function OwnerInvoicesPage() {
  const { user } = await getOwnerContext();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const [{ data: invoices }, { data: clients }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, client_id, amount, status, due_date, issue_date")
      .eq("owner_id", user.id)
      .order("due_date", { ascending: true }),
    supabase.from("clients").select("id, full_name").eq("owner_id", user.id).order("full_name")
  ]);

  async function createInvoiceAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const sb = await createClient();
    const lineItemsRaw = String(formData.get("line_items") ?? "[]");
    const lineItems = JSON.parse(lineItemsRaw) as Array<{
      description: string;
      quantity: number;
      unit_price: number;
      gst_applicable: boolean;
    }>;
    const subTotal = lineItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
    const gst = lineItems.reduce(
      (sum, i) => sum + (i.gst_applicable ? Number(i.quantity) * Number(i.unit_price) * 0.1 : 0),
      0
    );
    const total = subTotal + gst;
    const { data: existingNumbers } = await sb
      .from("invoices")
      .select("invoice_number")
      .eq("owner_id", owner.id);
    const invoiceNumber = getNextNumber(existingNumbers ?? [], "INV");
    const { data: created } = await sb
      .from("invoices")
      .insert({
        owner_id: owner.id,
        client_id: String(formData.get("client_id") ?? "") || null,
        invoice_number: invoiceNumber,
        issue_date: String(formData.get("issue_date") ?? "") || null,
        due_date: String(formData.get("due_date") ?? "") || null,
        subtotal: subTotal,
        gst_amount: gst,
        amount: total,
        status: "unpaid"
      })
      .select("id")
      .single();
    if (!created?.id) throw new Error("Failed to create invoice");
    if (created?.id && lineItems.length > 0) {
      const { error: itemsError } = await sb.from("invoice_items").insert(
        lineItems.map((i) => ({
          invoice_id: created.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          gst_applicable: i.gst_applicable,
          line_total: i.quantity * i.unit_price
        }))
      );
      if (itemsError) throw new Error(itemsError.message);
    }
    revalidatePath("/dashboard/owner/invoices");
  }

  async function updateInvoiceAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const sb = await createClient();
    const { error } = await sb
      .from("invoices")
      .update({
        client_id: String(formData.get("client_id") ?? "") || null,
        issue_date: String(formData.get("issue_date") ?? "") || null,
        due_date: String(formData.get("due_date") ?? "") || null
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/invoices");
  }

  const allInvoices = invoices ?? [];

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Invoices</h1>
      <InvoicesManager
        invoices={allInvoices}
        clients={(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        createInvoiceAction={createInvoiceAction}
        updateInvoiceAction={updateInvoiceAction}
      />
    </section>
  );
}


