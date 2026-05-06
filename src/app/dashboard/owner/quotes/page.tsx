import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import QuotesManager from "./quotes-manager";
import { filterDemoEntities } from "@/lib/demo/visibility";

function getNextNumber(
  existing: Array<Record<string, string | null>>,
  key: string,
  prefix: string
) {
  const max = existing.reduce((highest, item) => {
    const value = item[key] ?? "";
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(value);
    if (!match) return highest;
    const num = Number(match[1]);
    return Number.isFinite(num) ? Math.max(highest, num) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export default async function OwnerQuotesPage() {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: quotes }, { data: clients }] = await Promise.all([
    sb
      .from("quotes")
      .select("id, quote_number, client_id, client_name, total, status, created_at, is_demo")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id).order("full_name")
  ]);

  async function createQuoteAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const lineItems = JSON.parse(String(formData.get("line_items") ?? "[]")) as Array<{
      description: string;
      quantity: number;
      unit_price: number;
      gst_applicable: boolean;
    }>;
    const subTotal = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const gst = lineItems.reduce((sum, i) => sum + (i.gst_applicable ? i.quantity * i.unit_price * 0.1 : 0), 0);
    const total = subTotal + gst;
    const { data: existingNumbers } = await sb
      .from("quotes")
      .select("quote_number")
      .eq("owner_id", owner.id);
    const quoteNumber = getNextNumber(existingNumbers ?? [], "quote_number", "QTE");
    const { data: created } = await sb
      .from("quotes")
      .insert({
        owner_id: owner.id,
        client_id: String(formData.get("client_id") ?? "") || null,
        quote_number: quoteNumber,
        subtotal: subTotal,
        gst_amount: gst,
        total,
        status: "draft"
      })
      .select("id")
      .single();
    if (!created?.id) throw new Error("Failed to create quote");
    if (created?.id && lineItems.length > 0) {
      const { error: itemsError } = await sb.from("quote_items").insert(
        lineItems.map((i) => ({
          quote_id: created.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          gst_applicable: i.gst_applicable,
          line_total: i.quantity * i.unit_price
        }))
      );
      if (itemsError) throw new Error(itemsError.message);
    }
    revalidatePath("/dashboard/owner/quotes");
  }

  async function updateQuoteAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const { error } = await sb
      .from("quotes")
      .update({ client_id: String(formData.get("client_id") ?? "") || null })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/quotes");
  }

  async function acceptQuoteAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const { data: quote } = await sb
      .from("quotes")
      .select("id, quote_number, client_id, is_demo")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .single();
    if (quote?.is_demo) return;
    if (quote) {
      const { error: jobError } = await sb.from("jobs").insert({
        owner_id: owner.id,
        client_id: quote.client_id,
        title: `Job from ${quote.quote_number ?? "quote"}`,
        status: "scheduled",
        priority: "normal"
      });
      if (jobError) throw new Error(jobError.message);
      const { error: quoteError } = await sb
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quote.id)
        .eq("owner_id", owner.id);
      if (quoteError) throw new Error(quoteError.message);
    }
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/jobs");
  }

  async function convertToInvoiceAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const { data: quote } = await sb
      .from("quotes")
      .select("id, client_id, total, subtotal, gst_amount, is_demo")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!quote || quote.is_demo) return;

    const { data: existingInvoiceNumbers } = await sb
      .from("invoices")
      .select("invoice_number")
      .eq("owner_id", owner.id);
    const invoiceNumber = getNextNumber(existingInvoiceNumbers ?? [], "invoice_number", "INV");

    const { error: invoiceError } = await sb.from("invoices").insert({
      owner_id: owner.id,
      client_id: quote.client_id,
      invoice_number: invoiceNumber,
      subtotal: Number(quote.subtotal ?? quote.total ?? 0),
      gst_amount: Number(quote.gst_amount ?? 0),
      amount: Number(quote.total ?? 0),
      status: "unpaid"
    });
    if (invoiceError) throw new Error(invoiceError.message);

    await sb.from("quotes").update({ status: "accepted" }).eq("id", quote.id).eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/invoices");
  }

  const visibleQuotes = filterDemoEntities(quotes ?? []);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quotes</h1>
      <QuotesManager
        quotes={visibleQuotes}
        clients={filterDemoEntities(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        createQuoteAction={createQuoteAction}
        updateQuoteAction={updateQuoteAction}
        acceptQuoteAction={acceptQuoteAction}
        convertToInvoiceAction={convertToInvoiceAction}
      />
    </section>
  );
}


