import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import InvoicesManager from "./invoices-manager";
import { invoiceReminderEmailTemplate, sendEmail } from "@/lib/email";

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

type InvoicesPageProps = {
  searchParams?: {
    prefill_client_id?: string;
    prefill_title?: string;
    prefill_date?: string;
    prefill_job_id?: string;
  };
};

export default async function OwnerInvoicesPage({ searchParams }: InvoicesPageProps) {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: invoices }, { data: clients }] = await Promise.all([
    sb
      .from("invoices")
      .select("id, invoice_number, client_id, amount, status, due_date, issue_date")
      .eq("owner_id", user.id)
      .order("due_date", { ascending: true }),
    sb.from("clients").select("id, full_name").eq("owner_id", user.id).order("full_name")
  ]);

  async function createInvoiceAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
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
    const clientId = String(formData.get("client_id") ?? "") || null;
    if (clientId) {
      const { data: client } = await sb.from("clients").select("email, full_name").eq("id", clientId).maybeSingle();
      if (client?.email) {
        const payNowUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || `${process.env.NEXT_PUBLIC_APP_URL || "https://servlo.com.au"}/dashboard/client`;
        await sendEmail(
          client.email,
          `Invoice ${invoiceNumber} from SERVLO`,
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
  }

  async function updateInvoiceAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
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
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesManager
        invoices={allInvoices}
        clients={(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        createInvoiceAction={createInvoiceAction}
        updateInvoiceAction={updateInvoiceAction}
        prefill={searchParams}
      />
    </section>
  );
}


