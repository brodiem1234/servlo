import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import InvoicesManager from "./invoices-manager";
import { invoiceSentEmailTemplate, invoiceReminderEmailTemplate, sendEmail } from "@/lib/email";
import { filterDemoEntities } from "@/lib/demo/visibility";

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

type InvoicesPageProps = {
  searchParams?: Promise<{
    prefill_client_id?: string;
    prefill_title?: string;
    prefill_date?: string;
    prefill_job_id?: string;
    bucket?: string;
  }>;
};

export default async function OwnerInvoicesPage({ searchParams }: InvoicesPageProps) {
  const sp = (await searchParams) ?? {};
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "invoices");

  const invSelect =
    "id, invoice_number, client_id, total, subtotal, gst, status, due_date, issue_date, is_demo, notes";

  const [invResult, clientsResult, businessResult] = await Promise.all([
    sb.from("invoices").select(invSelect).eq("owner_id", user.id).order("due_date", { ascending: true }),
    sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id).order("full_name"),
    sb.from("businesses").select("business_name, abn, phone, address").eq("owner_id", user.id).maybeSingle()
  ]);

  let invoices: Array<{
    id: string;
    invoice_number: string | null;
    client_id: string | null;
    total: number | null;
    subtotal?: number | null;
    gst?: number | null;
    status: string | null;
    due_date: string | null;
    issue_date: string | null;
    is_demo?: boolean | null;
    notes?: string | null;
  }> = [];

  if (!invResult.error) {
    invoices = (invResult.data ?? []) as typeof invoices;
  } else {
    console.error("[invoices-page] query failed", invResult.error);
    invoices = [];
  }

  if (clientsResult.error) {
    throw new Error(clientsResult.error.message);
  }
  const clients = clientsResult.data ?? [];
  const businessRow = businessResult.data;
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";

  async function createInvoiceAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    let lineItems: Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }> = [];
    try {
      lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
    } catch { lineItems = []; }

    const subTotal = lineItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
    const gst = lineItems.reduce(
      (sum, i) => sum + (i.gst_applicable ? Number(i.quantity) * Number(i.unit_price) * 0.1 : 0),
      0
    );
    const total = subTotal + gst;

    const { data: existingNumbers } = await sb.from("invoices").select("invoice_number").eq("owner_id", owner.id);
    const invoiceNumber = getNextInvoiceNumber(existingNumbers ?? []);

    const notes = String(formData.get("notes") ?? "") || null;

    const requestedClientId = String(formData.get("client_id") ?? "") || null;
    const ownedClient = requestedClientId
      ? (await sb.from("clients").select("id").eq("id", requestedClientId).eq("owner_id", owner.id).maybeSingle()).data
      : null;
    const clientId = ownedClient?.id ?? null;

    const baseInsert = {
      owner_id: owner.id,
      client_id: clientId,
      invoice_number: invoiceNumber,
      issue_date: String(formData.get("issue_date") ?? "") || null,
      due_date: String(formData.get("due_date") ?? "") || null,
      subtotal: subTotal,
      status: "unpaid",
      notes
    };

    const created = await sb
      .from("invoices")
      .insert({ ...baseInsert, gst, total })
      .select("id")
      .single();

    if (!created.data?.id) throw new Error(created.error?.message ?? "Failed to create invoice");

    if (created.data?.id && lineItems.length > 0) {
      await sb.from("invoice_items").insert(
        lineItems.map((i) => ({
          invoice_id: created.data.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          gst_applicable: i.gst_applicable,
          line_total: i.quantity * i.unit_price
        }))
      );
    }

    if (clientId) {
      const { data: client } = await sb
        .from("clients")
        .select("email, full_name, is_demo")
        .eq("id", clientId)
        .maybeSingle();
      if (client?.email && !client.is_demo) {
        const payNowUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}/dashboard/client`;
        await sendEmail(
          client.email,
          `Invoice ${invoiceNumber}`,
          invoiceReminderEmailTemplate({
            clientName: client.full_name ?? "there",
            invoiceNumber,
            amount: `$${total.toFixed(2)}`,
            dueDate: String(formData.get("due_date") ?? "-"),
            payNowUrl
          })
        );
      }
    }
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner");
  }

  async function updateInvoiceAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");

    let lineItems: Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }> = [];
    try {
      lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
    } catch { lineItems = []; }

    const subTotal = lineItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
    const gst = lineItems.reduce(
      (sum, i) => sum + (i.gst_applicable ? Number(i.quantity) * Number(i.unit_price) * 0.1 : 0),
      0
    );
    const total = subTotal + gst;
    const notes = String(formData.get("notes") ?? "") || null;

    const payload: Record<string, unknown> = {
      client_id: String(formData.get("client_id") ?? "") || null,
      issue_date: String(formData.get("issue_date") ?? "") || null,
      due_date: String(formData.get("due_date") ?? "") || null,
      notes
    };

    if (lineItems.length > 0) {
      payload.subtotal = subTotal;
      payload.gst = gst;
      payload.total = total;
    }

    const { error } = await sb.from("invoices").update(payload).eq("id", id).eq("owner_id", owner.id);
    if (error) throw new Error(error.message);

    if (lineItems.length > 0) {
      await sb.from("invoice_items").delete().eq("invoice_id", id);
      await sb.from("invoice_items").insert(
        lineItems.map((i) => ({
          invoice_id: id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          gst_applicable: i.gst_applicable,
          line_total: i.quantity * i.unit_price
        }))
      );
    }

    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner");
  }

  async function markPaidAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const { error } = await sb
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner");
  }

  async function sendInvoiceEmailAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const { data: inv } = await sb
      .from("invoices")
      .select("invoice_number, total, subtotal, gst, due_date, client_id, is_demo")
      .eq("id", id)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!inv || inv.is_demo) return;
    const [clientRes, bizRes] = await Promise.all([
      sb.from("clients").select("email, full_name").eq("id", inv.client_id ?? "").maybeSingle(),
      sb.from("businesses").select("business_name, accent_colour").eq("owner_id", owner.id).maybeSingle()
    ]);
    if (!clientRes.data?.email) {
      throw new Error("This client has no email address — add one in the Clients page first.");
    }
    const client = clientRes.data;
    const biz = bizRes.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";
    const subtotal = Number(inv.subtotal ?? 0);
    const gst = Number(inv.gst ?? 0);
    const total = Number(inv.total ?? 0);
    await sendEmail(
      client.email,
      `Invoice ${inv.invoice_number ?? ""} from ${biz?.business_name ?? "SERVLO"}`,
      invoiceSentEmailTemplate({
        clientName: client.full_name ?? "there",
        businessName: biz?.business_name ?? "SERVLO",
        invoiceNumber: inv.invoice_number ?? "Invoice",
        dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-AU") : "-",
        subtotal: `$${subtotal.toFixed(2)}`,
        gst: `$${gst.toFixed(2)}`,
        total: `$${total.toFixed(2)}`,
        accentHex: biz?.accent_colour ?? undefined,
        appUrl
      }),
      "SERVLO <hello@servlo.com.au>"
    );
    revalidatePath("/dashboard/owner/invoices");
  }

  async function loadLineItemsAction(invoiceId: string): Promise<Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }>> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return [];
    const { data } = await sb
      .from("invoice_items")
      .select("description, quantity, unit_price, gst_applicable")
      .eq("invoice_id", invoiceId)
      .order("id", { ascending: true });
    return (data ?? []) as Array<{ description: string; quantity: number; unit_price: number; gst_applicable: boolean }>;
  }

  const visibleInvoices = filterDemoEntities(invoices ?? []);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesManager
        invoices={visibleInvoices}
        clients={filterDemoEntities(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        createInvoiceAction={createInvoiceAction}
        updateInvoiceAction={updateInvoiceAction}
        markPaidAction={markPaidAction}
        sendInvoiceEmailAction={sendInvoiceEmailAction}
        loadLineItemsAction={loadLineItemsAction}
        prefill={sp}
        initialBucket={typeof sp.bucket === "string" ? sp.bucket : undefined}
        businessProfile={businessRow ? { businessName: businessRow.business_name ?? null, abn: businessRow.abn ?? null, phone: businessRow.phone ?? null, address: businessRow.address ?? null } : null}
        appOrigin={appOrigin}
      />
    </section>
  );
}
