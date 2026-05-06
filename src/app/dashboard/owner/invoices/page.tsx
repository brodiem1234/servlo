import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import InvoicesManager from "./invoices-manager";
import { invoiceReminderEmailTemplate, sendEmail } from "@/lib/email";
import { filterDemoEntities } from "@/lib/demo/visibility";

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
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const invWideSelect =
    "id, invoice_number, client_id, amount, total, subtotal, gst, gst_amount, status, due_date, issue_date, is_demo";
  const invNarrowSelect = "id, invoice_number, client_id, amount, status, due_date, issue_date, is_demo";

  const clientsPromise = sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id).order("full_name");

  const invFirst = await sb.from("invoices").select(invWideSelect).eq("owner_id", user.id).order("due_date", {
    ascending: true
  });

  let invoices: Array<{
    id: string;
    invoice_number: string | null;
    client_id: string | null;
    amount: number | null;
    total?: number | null;
    subtotal?: number | null;
    gst?: number | null;
    gst_amount?: number | null;
    status: string | null;
    due_date: string | null;
    issue_date: string | null;
    is_demo?: boolean | null;
  }> = [];

  if (!invFirst.error) {
    invoices = (invFirst.data ?? []) as typeof invoices;
  } else if (invFirst.error.code === "PGRST204") {
    const invFb = await sb.from("invoices").select(invNarrowSelect).eq("owner_id", user.id).order("due_date", {
      ascending: true
    });
    invoices = (invFb.data ?? []) as typeof invoices;
    if (invFb.error) {
      console.error("[invoices-page] invoices fallback query failed", invFb.error);
      invoices = [];
    }
  } else {
    console.error("[invoices-page] invoices query failed", invFirst.error);
    invoices = [];
  }

  const { data: clients } = await clientsPromise;

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

    const baseInsert = {
      owner_id: owner.id,
      client_id: String(formData.get("client_id") ?? "") || null,
      invoice_number: invoiceNumber,
      issue_date: String(formData.get("issue_date") ?? "") || null,
      due_date: String(formData.get("due_date") ?? "") || null,
      subtotal: subTotal,
      status: "unpaid"
    };

    let created = await sb
      .from("invoices")
      .insert({ ...baseInsert, gst, total })
      .select("id")
      .single();

    if (created.error) {
      created = await sb
        .from("invoices")
        .insert({ ...baseInsert, gst_amount: gst, amount: total })
        .select("id")
        .single();
    }

    if (!created.data?.id) throw new Error(created.error?.message ?? "Failed to create invoice");
    if (created.data?.id && lineItems.length > 0) {
      const { error: itemsError } = await sb.from("invoice_items").insert(
        lineItems.map((i) => ({
          invoice_id: created.data.id,
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
      const { data: client } = await sb.from("clients").select("email, full_name, is_demo").eq("id", clientId).maybeSingle();
      if (client?.email && !client.is_demo) {
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

  const visibleInvoices = filterDemoEntities(invoices ?? []);
  const allInvoices = visibleInvoices;

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesManager
        invoices={allInvoices}
        clients={filterDemoEntities(clients ?? []).map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed client" }))}
        createInvoiceAction={createInvoiceAction}
        updateInvoiceAction={updateInvoiceAction}
        prefill={sp}
        initialBucket={typeof sp.bucket === "string" ? sp.bucket : undefined}
      />
    </section>
  );
}


