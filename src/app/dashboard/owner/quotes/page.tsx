import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import QuotesManager from "./quotes-manager";
import { filterDemoEntities } from "@/lib/demo/visibility";
import { quoteSentEmailTemplate, sendEmail } from "@/lib/email";

function getNextNumber(
  existing: Array<Record<string, string | null>>,
  key: string,
  prefix: string
) {
  const max = existing.reduce((highest, item) => {
    const value = item[key] ?? "";
    const match = new RegExp(`^${prefix}-?(\\d+)$`, "i").exec(value);
    if (!match) return highest;
    const num = Number(match[1]);
    return Number.isFinite(num) ? Math.max(highest, num) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
}

function getNextInvoiceNumber(existing: Array<{ invoice_number: string | null }>) {
  const max = existing.reduce((highest, item) => {
    const value = item.invoice_number ?? "";
    const match = /^INV-?(\d+)$/i.exec(value);
    if (!match) return highest;
    const num = Number(match[1]);
    return Number.isFinite(num) ? Math.max(highest, num) : highest;
  }, 0);
  return `INV-${String(max + 1).padStart(5, "0")}`;
}

type QuotesPageProps = {
  searchParams?: Promise<{ bucket?: string }>;
};

export default async function OwnerQuotesPage({ searchParams }: QuotesPageProps) {
  const sp = (await searchParams) ?? {};
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "quotes");

  const [quotesResult, clientsResult, profileResult] = await Promise.all([
    sb
      .from("quotes")
      .select("id, quote_number, client_id, total, subtotal, gst, status, created_at, is_demo, notes")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    sb.from("clients").select("id, full_name, email, is_demo").eq("owner_id", user.id).is("deleted_at", null).order("full_name"),
    sb.from("businesses").select("business_name, abn").eq("owner_id", user.id).maybeSingle()
  ]);

  if (quotesResult.error) {
    throw new Error(quotesResult.error.message);
  }
  const quotes = quotesResult.data ?? [];

  if (clientsResult.error) {
    throw new Error(clientsResult.error.message);
  }
  const clients = clientsResult.data ?? [];
  const clientNameById = new Map(clients.map((c) => [c.id, c.full_name ?? "Unknown client"]));
  const quotesWithClientName = quotes.map((quote) => ({
    ...quote,
    client_name: quote.client_id ? clientNameById.get(quote.client_id) ?? "Unknown client" : "Unknown client"
  }));

  const businessProfile = profileResult.data;

  async function createQuoteAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    let lineItems: Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }> = [];
    try {
      lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
    } catch { lineItems = []; }
    const subTotal = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const gst = lineItems.reduce((sum, i) => sum + (i.gst_applicable ? i.quantity * i.unit_price * 0.1 : 0), 0);
    const total = subTotal + gst;
    const { data: existingNumbers } = await sb.from("quotes").select("quote_number").eq("owner_id", owner.id);
    const quoteNumber = getNextNumber(existingNumbers ?? [], "quote_number", "QTE");
    const requestedClientId = String(formData.get("client_id") ?? "") || null;
    const ownedClient = requestedClientId
      ? (await sb.from("clients").select("id").eq("id", requestedClientId).eq("owner_id", owner.id).maybeSingle()).data
      : null;
    const clientId = ownedClient?.id ?? null;
    const notes = String(formData.get("notes") ?? "") || null;
    const sendImmediately = String(formData.get("send_immediately") ?? "false") === "true";
    const { data: created } = await sb
      .from("quotes")
      .insert({
        owner_id: owner.id,
        client_id: clientId,
        quote_number: quoteNumber,
        subtotal: subTotal,
        gst,
        total,
        status: sendImmediately ? "sent" : "draft",
        notes
      })
      .select("id")
      .single();
    if (!created?.id) throw new Error("Failed to create quote");
    if (created?.id && lineItems.length > 0) {
      await sb.from("quote_items").insert(
        lineItems.map((i) => ({
          quote_id: created.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          gst_applicable: i.gst_applicable,
          line_total: i.quantity * i.unit_price
        }))
      );
    }
    // Send email immediately if requested
    if (sendImmediately && clientId) {
      const [clientRes, bizRes] = await Promise.all([
        sb.from("clients").select("email, full_name, is_demo").eq("id", clientId).maybeSingle(),
        sb.from("businesses").select("business_name, accent_colour").eq("owner_id", owner.id).maybeSingle()
      ]);
      const client = clientRes.data;
      if (client?.email && !client.is_demo) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";
        await sendEmail(
          client.email,
          `Quote ${quoteNumber} from ${bizRes.data?.business_name ?? "SERVLO"}`,
          quoteSentEmailTemplate({
            clientName: client.full_name ?? "there",
            businessName: bizRes.data?.business_name ?? "SERVLO",
            quoteNumber,
            subtotal: `$${subTotal.toFixed(2)}`,
            gst: `$${gst.toFixed(2)}`,
            total: `$${total.toFixed(2)}`,
            accentHex: bizRes.data?.accent_colour ?? undefined,
            appUrl
          })
        );
      }
    }
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner");
  }

  async function updateQuoteAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    let lineItems: Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }> = [];
    try {
      lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
    } catch { lineItems = []; }
    const subTotal = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const gst = lineItems.reduce((sum, i) => sum + (i.gst_applicable ? i.quantity * i.unit_price * 0.1 : 0), 0);
    const total = subTotal + gst;
    const requestedClientId = String(formData.get("client_id") ?? "") || null;
    const ownedClient = requestedClientId
      ? (await sb.from("clients").select("id").eq("id", requestedClientId).eq("owner_id", owner.id).maybeSingle()).data
      : null;
    const clientId = ownedClient?.id ?? null;
    const notes = String(formData.get("notes") ?? "") || null;
    const payload: Record<string, unknown> = { client_id: clientId, notes };
    if (lineItems.length > 0) { payload.subtotal = subTotal; payload.gst = gst; payload.total = total; }
    const { error } = await sb.from("quotes").update(payload).eq("id", id).eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    if (lineItems.length > 0) {
      await sb.from("quote_items").delete().eq("quote_id", id);
      await sb.from("quote_items").insert(
        lineItems.map((i) => ({
          quote_id: id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          gst_applicable: i.gst_applicable,
          line_total: i.quantity * i.unit_price
        }))
      );
    }
    revalidatePath("/dashboard/owner/quotes");
  }

  async function updateQuoteStatusAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("quote_id") ?? "");
    const status = String(formData.get("status") ?? "");
    if (!id || !status) return;
    const { error } = await sb.from("quotes").update({ status }).eq("id", id).eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    // When a quote is accepted via the status dropdown, auto-create a linked job.
    if (status === "accepted") {
      const { data: quote } = await sb
        .from("quotes")
        .select("client_id, quote_number, notes, is_demo")
        .eq("id", id)
        .eq("owner_id", owner.id)
        .maybeSingle();
      if (quote && !quote.is_demo) {
        await sb.from("jobs").insert({
          owner_id: owner.id,
          client_id: quote.client_id,
          title: quote.quote_number ?? "Quote Job",
          description: (quote as { notes?: string | null }).notes ?? "",
          status: "scheduled",
          priority: "normal",
          is_demo: false,
          quote_id: id
        });
        revalidatePath("/dashboard/owner/jobs");
      }
    }
    revalidatePath("/dashboard/owner/quotes");
  }

  async function acceptQuoteAction(formData: FormData): Promise<{ jobId?: string }> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const { data: quote } = await sb
      .from("quotes")
      .select("id, quote_number, client_id, total, is_demo, notes")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .single();
    if (quote?.is_demo) return {};
    if (quote) {
      const { data: newJob } = await sb.from("jobs").insert({
        owner_id: owner.id,
        client_id: quote.client_id,
        title: quote.quote_number ?? "Quote Job",
        description: (quote as { notes?: string | null }).notes ?? "",
        status: "scheduled",
        priority: "normal",
        is_demo: false,
        quote_id: quote.id
      }).select("id").single();
      await sb.from("quotes").update({ status: "accepted" }).eq("id", quote.id).eq("owner_id", owner.id);
      revalidatePath("/dashboard/owner/quotes");
      revalidatePath("/dashboard/owner/jobs");
      revalidatePath("/dashboard/owner");
      return { jobId: newJob?.id };
    }
    return {};
  }

  async function convertToInvoiceAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const { data: quote } = await sb
      .from("quotes")
      .select("id, client_id, total, subtotal, gst, is_demo, notes")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!quote || quote.is_demo) return;

    // Fetch quote line items to copy across
    const { data: quoteItems } = await sb
      .from("quote_items")
      .select("description, quantity, unit_price, gst_applicable, line_total")
      .eq("quote_id", quoteId)
      .order("id", { ascending: true });

    const { data: existingInvoiceNumbers } = await sb.from("invoices").select("invoice_number").eq("owner_id", owner.id);
    const invoiceNumber = getNextInvoiceNumber(existingInvoiceNumbers ?? []);

    const subtotal = Number(quote.subtotal ?? quote.total ?? 0);
    const gst = Number(quote.gst ?? 0);
    const total = subtotal + gst;
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueDate = due.toISOString().slice(0, 10);
    const issueDate = new Date().toISOString().slice(0, 10);

    const base = {
      owner_id: owner.id,
      client_id: quote.client_id,
      invoice_number: invoiceNumber,
      status: "unpaid",
      subtotal,
      gst,
      issue_date: issueDate,
      due_date: dueDate,
      notes: (quote as { notes?: string | null }).notes ?? null
    };

    const invTry1 = await sb.from("invoices").insert({ ...base, total }).select("id").single();
    if (invTry1.error) throw new Error(invTry1.error.message);
    const invoiceId = invTry1.data?.id ?? null;

    if (invoiceId && (quoteItems ?? []).length > 0) {
      await sb.from("invoice_items").insert(
        (quoteItems ?? []).map((qi) => ({
          invoice_id: invoiceId,
          description: qi.description,
          quantity: qi.quantity,
          unit_price: qi.unit_price,
          gst_applicable: qi.gst_applicable,
          line_total: qi.line_total
        }))
      );
    }

    await sb.from("quotes").update({ status: "accepted" }).eq("id", quote.id).eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner");
  }

  async function sendQuoteEmailAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const { data: quote } = await sb
      .from("quotes")
      .select("id, quote_number, client_id, is_demo, created_at, subtotal, gst, total")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!quote || quote.is_demo) return;
    const [clientRes, bizRes] = await Promise.all([
      sb.from("clients").select("email, full_name").eq("id", quote.client_id ?? "").maybeSingle(),
      sb.from("businesses").select("business_name, accent_colour").eq("owner_id", owner.id).maybeSingle()
    ]);
    if (!clientRes.data?.email) {
      throw new Error("This client has no email address — add one in the Clients page first.");
    }
    const client = clientRes.data;
    const biz = bizRes.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";
    const subtotal = Number(quote.subtotal ?? 0);
    const gst = Number(quote.gst ?? 0);
    const total = Number(quote.total ?? 0);
    await sendEmail(
      client.email,
      `Quote ${quote.quote_number ?? ""} from ${biz?.business_name ?? "SERVLO"}`,
      quoteSentEmailTemplate({
        clientName: client.full_name ?? "there",
        businessName: biz?.business_name ?? "SERVLO",
        quoteNumber: quote.quote_number ?? "Quote",
        subtotal: `$${subtotal.toFixed(2)}`,
        gst: `$${gst.toFixed(2)}`,
        total: `$${total.toFixed(2)}`,
        accentHex: biz?.accent_colour ?? undefined,
        appUrl
      }),
      "SERVLO <hello@servlo.com.au>"
    );
    await sb.from("quotes").update({ status: "sent" }).eq("id", quote.id).eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner/quotes");
  }

  type QuickCreateResult = { ok: boolean; id?: string; label?: string; message?: string };

  async function quickCreateClientForQuoteAction(formData: FormData): Promise<QuickCreateResult> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const full_name = String(formData.get("full_name") ?? "").trim();
    if (!full_name) return { ok: false, message: "Name is required" };
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const { data, error } = await sb
      .from("clients")
      .insert({
        owner_id: owner.id,
        is_demo: false,
        full_name,
        phone: phone || null,
        email: email || null,
        status: "active",
        source: "other",
        portal_token: crypto.randomUUID(),
        company_name: "",
        abn: "",
        address: "",
        suburb: "",
        state: "",
        postcode: "",
        notes: ""
      })
      .select("id, full_name")
      .maybeSingle();
    if (error) {
      const fb = await sb
        .from("clients")
        .insert({ owner_id: owner.id, is_demo: false, full_name, phone: phone || null, email: email || null, notes: "" })
        .select("id, full_name")
        .maybeSingle();
      if (fb.error) return { ok: false, message: fb.error.message };
      revalidatePath("/dashboard/owner/clients");
      return { ok: true, id: fb.data?.id, label: fb.data?.full_name ?? full_name };
    }
    revalidatePath("/dashboard/owner/clients");
    return { ok: true, id: data?.id, label: data?.full_name ?? full_name };
  }

  async function loadQuoteItemsAction(quoteId: string): Promise<Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }>> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return [];
    const { data } = await sb
      .from("quote_items")
      .select("description, quantity, unit_price, gst_applicable")
      .eq("quote_id", quoteId)
      .order("id", { ascending: true });
    return (data ?? []) as Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }>;
  }

  async function deleteQuoteAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return { ok: false };
    const id = String(formData.get("id") ?? "");
    const { error } = await sb.from("quotes").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("owner_id", owner.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/owner/quotes");
    return { ok: true };
  }

  async function restoreQuoteAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return { ok: false };
    const id = String(formData.get("id") ?? "");
    const { error } = await sb.from("quotes").update({ deleted_at: null }).eq("id", id).eq("owner_id", owner.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/owner/quotes");
    return { ok: true };
  }

  const visibleQuotes = filterDemoEntities(quotesWithClientName ?? []);
  const visibleClients = filterDemoEntities(clients ?? []);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quotes</h1>
      <QuotesManager
        quotes={visibleQuotes}
        clients={visibleClients.map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client", email: c.email }))}
        createQuoteAction={createQuoteAction}
        updateQuoteAction={updateQuoteAction}
        updateQuoteStatusAction={updateQuoteStatusAction}
        acceptQuoteAction={acceptQuoteAction}
        convertToInvoiceAction={convertToInvoiceAction}
        sendQuoteEmailAction={sendQuoteEmailAction}
        loadQuoteItemsAction={loadQuoteItemsAction}
        quickCreateClientForQuoteAction={quickCreateClientForQuoteAction}
        initialBucket={typeof sp.bucket === "string" ? sp.bucket : undefined}
        businessProfile={businessProfile ? { businessName: businessProfile.business_name ?? null, abn: businessProfile.abn ?? null } : null}
        deleteQuoteAction={deleteQuoteAction}
        restoreQuoteAction={restoreQuoteAction}
      />
    </section>
  );
}
