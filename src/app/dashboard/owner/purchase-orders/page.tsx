import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { filterDemoEntities } from "@/lib/demo/visibility";

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

export default async function PurchaseOrdersPage() {
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "purchase_orders");

  const [{ data: pos }, { data: suppliers }, { data: jobs }] = await Promise.all([
    sb
      .from("purchase_orders")
      .select("id, po_number, status, total, created_at, supplier_client_id, job_id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    sb
      .from("clients")
      .select("id, full_name, client_type, is_demo")
      .eq("owner_id", user.id)
      .order("full_name"),
    sb.from("jobs").select("id, title, is_demo").eq("owner_id", user.id).order("scheduled_date", { ascending: false })
  ]);

  const supplierRows = filterDemoEntities(suppliers ?? []).filter(
    (c: { client_type?: string | null }) => (c.client_type ?? "customer") === "supplier"
  );
  const jobRows = filterDemoEntities(jobs ?? []);

  async function createPurchaseOrderAction(formData: FormData) {
    "use server";
    const sb2 = await createClient();
    const {
      data: { user: owner }
    } = await sb2.auth.getUser();
    if (!owner) redirect("/auth/login");

    const { data: nums } = await sb2.from("purchase_orders").select("po_number").eq("owner_id", owner.id);
    const po_number = nextPoNumber(nums ?? []);

    const supplier_client_id = String(formData.get("supplier_client_id") ?? "") || null;
    const job_id = String(formData.get("job_id") ?? "") || null;
    const status = String(formData.get("status") ?? "draft") || "draft";
    const notes = String(formData.get("notes") ?? "") || null;

    const desc = String(formData.get("line_description") ?? "");
    const qty = Number(formData.get("line_qty") ?? 1);
    const unit = Number(formData.get("line_unit_price") ?? 0);
    const total = qty * unit;

    const { data: createdPo, error } = await sb2
      .from("purchase_orders")
      .insert({
        owner_id: owner.id,
        po_number,
        supplier_client_id,
        job_id,
        status,
        total,
        notes
      })
      .select("id")
      .single();

    if (error || !createdPo?.id) throw new Error(error?.message ?? "Could not create PO");

    await sb2.from("purchase_order_items").insert({
      purchase_order_id: createdPo.id,
      description: desc || "Materials",
      quantity: qty,
      unit_price: unit,
      sort_order: 0
    });

    revalidatePath("/dashboard/owner/purchase-orders");
  }

  const rows = pos ?? [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Purchase orders</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Send orders to suppliers for job materials. Suppliers are clients marked as Supplier on the Clients page.
        </p>
      </div>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create purchase order</h2>
        <form action={createPurchaseOrderAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Supplier</span>
            <select
              name="supplier_client_id"
              required
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
            >
              <option value="">Select supplier…</option>
              {supplierRows.map((s: { id: string; full_name: string | null }) => (
                <option key={s.id} value={s.id}>
                  {s.full_name ?? s.id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Related job (optional)</span>
            <select name="job_id" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm">
              <option value="">—</option>
              {jobRows.map((j: { id: string; title: string | null }) => (
                <option key={j.id} value={j.id}>
                  {j.title ?? j.id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--text-muted)]">Status</span>
            <select name="status" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="billed">Billed</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--text-muted)]">Line description</span>
            <input name="line_description" className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm" placeholder="e.g. Timber stock" />
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Qty</span>
            <input name="line_qty" type="number" step="0.01" defaultValue={1} className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Unit price</span>
            <input name="line_unit_price" type="number" step="0.01" defaultValue={0} className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--text-muted)]">Notes</span>
            <textarea name="notes" rows={2} className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white">
              Save purchase order
            </button>
          </div>
        </form>
      </article>

      <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">All purchase orders</h2>
        <table className="mt-3 w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
              <th className="py-2 pr-2">PO #</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Total</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-[var(--text-muted)]">
                  No purchase orders yet.
                </td>
              </tr>
            ) : (
              rows.map((row: { id: string; po_number: string | null; status: string | null; total: number | null; created_at: string | null }) => (
                <tr key={row.id} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-2 font-medium text-[var(--text-primary)]">{row.po_number}</td>
                  <td className="py-2 pr-2 capitalize text-[var(--text-secondary)]">{row.status}</td>
                  <td className="py-2 pr-2 text-[var(--text-secondary)]">${Number(row.total ?? 0).toFixed(2)}</td>
                  <td className="py-2 text-[var(--text-muted)]">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString("en-AU") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  );
}
