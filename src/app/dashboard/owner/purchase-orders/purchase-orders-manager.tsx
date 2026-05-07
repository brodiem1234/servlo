"use client";

import { useState, useEffect } from "react";

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

type SupplierRef = { id: string; label: string; email?: string | null };
type JobRef = { id: string; label: string };
type LineItem = { description: string; quantity: number; unit_price: number };

type Props = {
  pos: PORow[];
  suppliers: SupplierRef[];
  jobs: JobRef[];
  createPurchaseOrderAction: (formData: FormData) => Promise<void>;
  updatePurchaseOrderAction: (formData: FormData) => Promise<void>;
  updatePOStatusAction: (formData: FormData) => Promise<void>;
  loadPOItemsAction: (poId: string) => Promise<LineItem[]>;
};

const emptyLine: LineItem = { description: "", quantity: 1, unit_price: 0 };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "billed", label: "Billed" }
];

function statusColor(status: string | null) {
  const s = (status ?? "draft").toLowerCase();
  if (s === "billed") return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
  if (s === "received") return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100";
  if (s === "sent") return "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

export default function PurchaseOrdersManager({
  pos,
  suppliers,
  jobs,
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
  updatePOStatusAction,
  loadPOItemsAction
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingPO, setEditingPO] = useState<PORow | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const total = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  function startCreate() {
    setEditingId("");
    setEditingPO(null);
    setSupplierId("");
    setJobId("");
    setStatus("draft");
    setNotes("");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  async function startEdit(po: PORow) {
    setEditingId(po.id);
    setEditingPO(po);
    setSupplierId(po.supplier_client_id ?? "");
    setJobId(po.job_id ?? "");
    setStatus(po.status ?? "draft");
    setNotes(po.notes ?? "");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
    try {
      const items = await loadPOItemsAction(po.id);
      if (items.length > 0) setLineItems(items);
    } catch { /* silent */ }
  }

  const onSubmit = async (fd: FormData) => {
    try {
      if (editingId) await updatePurchaseOrderAction(fd);
      else await createPurchaseOrderAction(fd);
      setToast({ type: "success", message: editingId ? "PO updated" : "PO created" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save purchase order" });
      console.error(error);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Purchase Orders</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Send orders to suppliers for job materials. Suppliers are clients marked as <strong>Supplier</strong> on the Clients page.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)]"
        >
          New Purchase Order
        </button>
      </div>

      {toast ? (
        <div
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
              : "border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm dark:border-orange-800 dark:bg-orange-950/40">
          <strong className="text-orange-900 dark:text-orange-100">No suppliers found.</strong>
          <span className="ml-1 text-orange-800 dark:text-orange-200">
            Go to <a href="/dashboard/owner/clients" className="font-semibold underline">Clients</a>, add a client and set their type to <em>Supplier</em>.
          </span>
        </div>
      ) : null}

      <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-2 py-3">PO #</th>
              <th className="px-2 py-3">Supplier</th>
              <th className="px-2 py-3">Job</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Total</th>
              <th className="px-2 py-3">Created</th>
              <th className="px-2 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-10 text-center text-sm text-[var(--text-muted)]">
                  No purchase orders yet. Create one above.
                </td>
              </tr>
            ) : (
              pos.map((row) => {
                const supplierLabel = suppliers.find((s) => s.id === row.supplier_client_id)?.label ?? "—";
                const jobLabel = jobs.find((j) => j.id === row.job_id)?.label ?? "—";
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--bg-primary)]"
                    onClick={() => startEdit(row)}
                  >
                    <td className="px-2 py-3 font-mono text-xs font-semibold text-[var(--text-muted)]">
                      <span className="text-[var(--text-primary)]">{row.po_number}</span>
                    </td>
                    <td className="px-2 py-3 text-[var(--text-secondary)]">{supplierLabel}</td>
                    <td className="px-2 py-3 text-[var(--text-secondary)]">{row.job_id ? jobLabel : "—"}</td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <form action={updatePOStatusAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <select
                          name="status"
                          defaultValue={row.status ?? "draft"}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(row.status)}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </form>
                    </td>
                    <td className="px-2 py-3 font-semibold text-[var(--text-primary)]">
                      ${Number(row.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-[var(--text-muted)]">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 md:flex-row md:justify-end">
          <div className="relative ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editingId ? `Edit PO ${editingPO?.po_number ?? ""}` : "New Purchase Order"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
            </div>

            <form action={onSubmit} className="space-y-5">
              <input type="hidden" name="id" value={editingId} />
              <input type="hidden" name="line_items" value={JSON.stringify(lineItems)} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supplier_client_id"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Select supplier…</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Related Job (optional)
                  </label>
                  <select
                    name="job_id"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">—</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Status
                  </label>
                  <select
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={() => setLineItems((prev) => [...prev, { ...emptyLine }])}
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                  >
                    + Add row
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full min-w-[400px] text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[var(--text-muted)]">
                        <th className="px-3 py-2 font-semibold">Description</th>
                        <th className="px-2 py-2 font-semibold">Qty</th>
                        <th className="px-2 py-2 font-semibold">Unit Price</th>
                        <th className="px-2 py-2 font-semibold">Total</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-2 py-1.5">
                            <input
                              value={item.description}
                              onChange={(e) =>
                                setLineItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                                )
                              }
                              placeholder="e.g. Timber stock"
                              className="h-8 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 text-xs text-[var(--text-primary)]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                setLineItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x))
                                )
                              }
                              className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 text-xs text-[var(--text-primary)]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                setLineItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, unit_price: Number(e.target.value) } : x))
                                )
                              }
                              className="h-8 w-24 rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 text-xs text-[var(--text-primary)]"
                            />
                          </td>
                          <td className="px-2 py-1.5 font-semibold text-[var(--text-primary)]">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={lineItems.length === 1}
                              className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-primary)] disabled:opacity-40"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-right text-sm font-bold text-[var(--text-primary)]">
                  Total: ${total.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  {editingId ? "Save Changes" : "Create PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
