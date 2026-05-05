import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import QuotesManager from "./quotes-manager";

export default async function OwnerQuotesPage() {
  const { user } = await getOwnerContext();
  if (!user) redirect("/auth/login");

  const supabase = createClient();
  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, client_id, client_name, total, status, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, full_name").eq("owner_id", user.id).order("full_name")
  ]);

  async function createQuoteAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const sb = createClient();
    const lineItems = JSON.parse(String(formData.get("line_items") ?? "[]")) as Array<{
      description: string;
      quantity: number;
      unit_price: number;
      gst_applicable: boolean;
    }>;
    const subTotal = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const gst = lineItems.reduce((sum, i) => sum + (i.gst_applicable ? i.quantity * i.unit_price * 0.1 : 0), 0);
    const total = subTotal + gst;
    const { count } = await sb
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", owner.id);
    const quoteNumber = `QTE-${String((count ?? 0) + 1).padStart(3, "0")}`;
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
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const sb = createClient();
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
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const sb = createClient();
    const { data: quote } = await sb
      .from("quotes")
      .select("id, quote_number, client_id")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .single();
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

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Quotes</h1>
      <QuotesManager
        quotes={quotes ?? []}
        clients={(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        createQuoteAction={createQuoteAction}
        updateQuoteAction={updateQuoteAction}
        acceptQuoteAction={acceptQuoteAction}
      />
    </section>
  );
}
