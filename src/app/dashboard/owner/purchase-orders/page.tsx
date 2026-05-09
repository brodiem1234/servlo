import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { filterDemoEntities } from "@/lib/demo/visibility";
import PurchaseOrdersManager from "./purchase-orders-manager";
import { purchaseOrderEmailTemplate, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function nextPoNumber(existing: Array<{ po_number: string | null }>) {
  const max = existing.reduce((highest, row) => {
    const v = row.po_number ?? "";
    const m = /^PO(\d+)$/.exec(v);
    if (!m) return highest;
    const n = Number(m[1]);
    return Number.isFinite(n) ? Math.max(highest, n) : highest;
  }, 0);
  return `PO${String(max + 1).padStart(5, "0")}`;
}

type PORow = {
  id: string;
  po_number: string | null;
  status: string | null;
  total: number | null;
  created_at: string | null;
  supplier_client_id: string | null;
  job_id: string | null;
  notes: string | null;
};

export default async function PurchaseOrdersPage() {
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "purchase_orders");

  const [posResult, suppliersResult, jobsResult] = await Promise.all([
    sb
      .from("purchase_orders")
      .select("id, po_number, status, total, created_at, supplier_client_id, job_id, notes")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    sb
      .from("clients")
      .select("id, full_name, email, client_type, is_demo")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("full_name"),
    sb.from("jobs").select("id, title, is_demo").eq("owner_id", user.id).is("deleted_at", null).order("scheduled_date", { ascending: false })
  ]);

  const pos = posResult.data ?? [];
  if (suppliersResult.error) {
    throw new Error(suppliersResult.error.message);
  }
  const suppliers = suppliersResult.data ?? [];
  const jobs = jobsResult.data ?? [];

  const supplierRows = filterDemoEntities(suppliers ?? []).filter(
    (c: { client_type?: string | null }) => (c.client_type ?? "customer") === "supplier"
  );
  const jobRows = filterDemoEntities(jobs ?? []);

  async function createPurchaseOrderAction(formData: FormData) {
    "use server";
    const sb2 = await createClient();
    const { data: { user: owner } } = await sb2.auth.getUser();
    if (!owner) redirect("/auth/login");

    const { data: nums } = await sb2.from("purchase_orders").select("po_number").eq("owner_id", owner.id);
    const po_number = nextPoNumber(nums ?? []);

    const requestedSupplierId = String(formData.get("supplier_client_id") ?? "") || null;
    const ownedSupplier = requestedSupplierId
      ? (await sb2.from("clients").select("id").eq("id", requestedSupplierId).eq("owner_id", owner.id).maybeSingle()).data
      : null;
    const supplier_client_id = ownedSupplier?.id ?? null;
    const job_id = String(formData.get("job_id") ?? "") || null;
    const status = String(formData.get("status") ?? "draft") || "draft";
    const notes = String(formData.get("notes") ?? "") || null;

    let lineItems: Array<{ description: string; quantity: number; unit_price: number }> = [];
    try {
      lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
    } catch { lineItems = []; }

    if (lineItems.length === 0) {
      const desc = String(formData.get("line_description") ?? "");
      const qty = Number(formData.get("line_qty") ?? 1);
      const unit = Number(formData.get("line_unit_price") ?? 0);
      lineItems = [{ description: desc || "Materials", quantity: qty, unit_price: unit }];
    }

    const total = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const { data: createdPo, error } = await sb2
      .from("purchase_orders")
      .insert({ owner_id: owner.id, po_number, supplier_client_id, job_id, status, total, notes })
      .select("id")
      .single();

    if (error || !createdPo?.id) throw new Error(error?.message ?? "Could not create PO");

    if (lineItems.length > 0) {
      await sb2.from("purchase_order_items").insert(
        lineItems.map((li, idx) => ({
          purchase_order_id: createdPo.id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          sort_order: idx
        }))
      );
    }

    revalidatePath("/dashboard/owner/purchase-orders");
  }

  async function updatePurchaseOrderAction(formData: FormData) {
    "use server";
    const sb2 = await createClient();
    const { data: { user: owner } } = await sb2.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const requestedSupplierId = String(formData.get("supplier_client_id") ?? "") || null;
    const ownedSupplier = requestedSupplierId
      ? (await sb2.from("clients").select("id").eq("id", requestedSupplierId).eq("owner_id", owner.id).maybeSingle()).data
      : null;
    const supplier_client_id = ownedSupplier?.id ?? null;
    const job_id = String(formData.get("job_id") ?? "") || null;
    const status = String(formData.get("status") ?? "draft");
    const notes = String(formData.get("notes") ?? "") || null;

    let lineItems: Array<{ description: string; quantity: number; unit_price: number }> = [];
    try {
      lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
    } catch { lineItems = []; }

    const total = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const { error } = await sb2
      .from("purchase_orders")
      .update({ supplier_client_id, job_id, status, total, notes })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);

    if (lineItems.length > 0) {
      await sb2.from("purchase_order_items").delete().eq("purchase_order_id", id);
      await sb2.from("purchase_order_items").insert(
        lineItems.map((li, idx) => ({
          purchase_order_id: id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          sort_order: idx
        }))
      );
    }

    revalidatePath("/dashboard/owner/purchase-orders");
  }

  async function updatePOStatusAction(formData: FormData) {
    "use server";
    const sb2 = await createClient();
    const { data: { user: owner } } = await sb2.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "draft");
    if (!id) return;
    const { error } = await sb2
      .from("purchase_orders")
      .update({ status })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/purchase-orders");
  }

  async function loadPOItemsAction(poId: string): Promise<Array<{ description: string; quantity: number; unit_price: number }>> {
    "use server";
    const sb2 = await createClient();
    const { data: { user: owner } } = await sb2.auth.getUser();
    if (!owner) return [];
    const { data } = await sb2
      .from("purchase_order_items")
      .select("description, quantity, unit_price")
      .eq("purchase_order_id", poId)
      .order("sort_order", { ascending: true });
    return (data ?? []) as Array<{ description: string; quantity: number; unit_price: number }>;
  }

  type QuickCreateResult = { ok: boolean; id?: string; label?: string; message?: string };

  async function quickCreateSupplierAction(formData: FormData): Promise<QuickCreateResult> {
    "use server";
    const sb2 = await createClient();
    const { data: { user: owner } } = await sb2.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const full_name = String(formData.get("full_name") ?? "").trim();
    if (!full_name) return { ok: false, message: "Company name is required" };
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const abn = String(formData.get("abn") ?? "").trim();
    const { data, error } = await sb2
      .from("clients")
      .insert({
        owner_id: owner.id,
        is_demo: false,
        full_name,
        email: email || null,
        phone: phone || null,
        client_type: "supplier",
        status: "active",
        source: "other",
        portal_token: crypto.randomUUID(),
        company_name: full_name,
        abn: abn || "",
        address: "",
        suburb: "",
        state: "",
        postcode: "",
        notes: ""
      })
      .select("id, full_name")
      .maybeSingle();
    if (error) {
      const fb = await sb2
        .from("clients")
        .insert({ owner_id: owner.id, is_demo: false, full_name, email: email || null, phone: phone || null, client_type: "supplier", notes: "" })
        .select("id, full_name")
        .maybeSingle();
      if (fb.error) return { ok: false, message: fb.error.message };
      revalidatePath("/dashboard/owner/clients");
      return { ok: true, id: fb.data?.id, label: fb.data?.full_name ?? full_name };
    }
    revalidatePath("/dashboard/owner/clients");
    return { ok: true, id: data?.id, label: data?.full_name ?? full_name };
  }

  async function sendPOEmailAction(formData: FormData): Promise<void> {
    "use server";
    const sb2 = await createClient();
    const { data: { user: owner } } = await sb2.auth.getUser();
    if (!owner) return;
    const poId = String(formData.get("po_id") ?? "");
    if (!poId) return;
    const { data: po } = await sb2
      .from("purchase_orders")
      .select("po_number, supplier_client_id, notes, total")
      .eq("id", poId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!po) return;
    const [supplierRes, bizRes, itemsRes] = await Promise.all([
      sb2.from("clients").select("email, full_name").eq("id", po.supplier_client_id ?? "").maybeSingle(),
      sb2.from("businesses").select("business_name, accent_colour").eq("owner_id", owner.id).maybeSingle(),
      sb2.from("purchase_order_items").select("description, quantity, unit_price").eq("purchase_order_id", poId).order("sort_order")
    ]);
    if (!supplierRes.data?.email) {
      throw new Error("Supplier has no email address — add one in the Clients page first.");
    }
    const supplier = supplierRes.data;
    const biz = bizRes.data;
    const items = (itemsRes.data ?? []) as Array<{ description: string; quantity: number; unit_price: number }>;
    await sendEmail(
      supplier.email,
      `Purchase Order ${po.po_number ?? ""} from ${biz?.business_name ?? "SERVLO"}`,
      purchaseOrderEmailTemplate({
        supplierName: supplier.full_name ?? "Supplier",
        businessName: biz?.business_name ?? "SERVLO",
        poNumber: po.po_number ?? "PO",
        items,
        total: Number(po.total ?? 0),
        notes: po.notes,
        accentHex: biz?.accent_colour ?? undefined
      }),
      "SERVLO <hello@servlo.com.au>"
    );
    await sb2.from("purchase_orders").update({ status: "sent" }).eq("id", poId).eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner/purchase-orders");
  }

  const rows = (pos ?? []) as PORow[];

  return (
    <PurchaseOrdersManager
      pos={rows}
      suppliers={supplierRows.map((s: { id: string; full_name: string | null; email?: string | null }) => ({ id: s.id, label: s.full_name ?? s.id, email: s.email ?? null }))}
      jobs={jobRows.map((j: { id: string; title: string | null }) => ({
        id: j.id,
        label: j.title ?? j.id
      }))}
      createPurchaseOrderAction={createPurchaseOrderAction}
      updatePurchaseOrderAction={updatePurchaseOrderAction}
      updatePOStatusAction={updatePOStatusAction}
      loadPOItemsAction={loadPOItemsAction}
      quickCreateSupplierAction={quickCreateSupplierAction}
      sendPOEmailAction={sendPOEmailAction}
    />
  );
}
