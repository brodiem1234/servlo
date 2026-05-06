"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { DemoBadge } from "@/components/demo-badge";

type Invoice = {
  id: string;
  invoice_number: string | null;
  client_id: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  issue_date: string | null;
  is_demo?: boolean | null;
};

type ClientRef = { id: string; label: string };
type LineItem = { description: string; quantity: number; unit_price: number; gst_applicable: boolean };

type Props = {
  invoices: Invoice[];
  clients: ClientRef[];
  createInvoiceAction: (formData: FormData) => Promise<void>;
  updateInvoiceAction: (formData: FormData) => Promise<void>;
  prefill?: {
    prefill_client_id?: string;
    prefill_title?: string;
    prefill_date?: string;
    prefill_job_id?: string;
  };
};

const emptyLine: LineItem = { description: "", quantity: 1, unit_price: 0, gst_applicable: true };

export default function InvoicesManager({
  invoices,
  clients,
  createInvoiceAction,
  updateInvoiceAction,
  prefill
}: Props) {
  const getStatusBadge = (invoice: Invoice) => {
    const status = (invoice.status ?? "").toLowerCase();
    const paid = status === "paid";
    const overdue =
      !paid &&
      Boolean(invoice.due_date) &&
      new Date(invoice.due_date as string).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

    if (paid) {
      return {
        label: "Paid",
        className:
          "border border-emerald-600/40 bg-emerald-100 !text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950 dark:!text-emerald-100"
      };
    }
    if (overdue) {
      return {
        label: "Overdue",
        className:
          "border border-red-600/70 bg-red-100 !text-red-900 dark:border-red-400 dark:bg-red-950 dark:!text-red-100"
      };
    }
    const label =
      status === "draft" ? "Draft" : status === "sent" ? "Sent" : status ? status : "Unpaid";
    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      className:
        "border border-amber-600/40 bg-amber-50 !text-amber-950 dark:border-amber-500/50 dark:bg-amber-950 dark:!text-amber-100"
    };
  };

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!prefill?.prefill_client_id) return;
    setEditingId("");
    setClientId(prefill.prefill_client_id);
    setIssueDate(prefill.prefill_date?.slice(0, 10) ?? "");
    setDueDate(prefill.prefill_date?.slice(0, 10) ?? "");
    setLineItems([
      {
        ...emptyLine,
        description: prefill.prefill_title ?? "Job invoice",
        quantity: 1,
        unit_price: 0
      }
    ]);
    setOpen(true);
  }, [prefill]);

  const subTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [lineItems]
  );
  const gst = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + (item.gst_applicable ? item.quantity * item.unit_price * 0.1 : 0),
        0
      ),
    [lineItems]
  );

  function startCreate() {
    setEditingId("");
    setClientId("");
    setIssueDate("");
    setDueDate("");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  function startEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setClientId(invoice.client_id ?? "");
    setIssueDate(invoice.issue_date ? invoice.issue_date.slice(0, 10) : "");
    setDueDate(invoice.due_date ? invoice.due_date.slice(0, 10) : "");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  const action = async (fd: FormData) => {
    try {
      if (editingId) {
        await updateInvoiceAction(fd);
      } else {
        await createInvoiceAction(fd);
      }
      setToast({ type: "success", message: editingId ? "Invoice updated" : "Invoice created" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save invoice" });
      console.error(error);
    }
  };

  const overdue = invoices.filter((invoice) => {
    if (invoice.is_demo) return false;
    if (!invoice.due_date || (invoice.status ?? "").toLowerCase() === "paid") return false;
    const due = new Date(invoice.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  });
  const nextInvoiceNumber = `INV-${String(invoices.length + 1).padStart(3, "0")}`;

  const downloadPdf = (invoice: Invoice) => {
    if (invoice.is_demo) return;
    const doc = new jsPDF();
    doc.text("SERVLO Invoice", 14, 20);
    doc.text(`Invoice #: ${invoice.invoice_number ?? "-"}`, 14, 32);
    doc.text(`Amount: $${Number(invoice.amount ?? 0).toFixed(2)}`, 14, 42);
    doc.text(
      `Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-"}`,
      14,
      52
    );
    doc.text(`Status: ${getStatusBadge(invoice).label}`, 14, 62);
    doc.save(`${invoice.invoice_number ?? "invoice"}.pdf`);
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success" ? "bg-green-50 text-[#22c55e]" : "bg-red-50 text-[#ef4444]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      <button onClick={startCreate} className="rounded-md bg-[#0db8c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a9dab]">
        New Invoice
      </button>
      <article className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/80">
        <h2 className="font-semibold !text-red-900 dark:!text-red-100">Overdue invoices ({overdue.length})</h2>
        {overdue.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-sm !text-red-800 dark:!text-red-200">
            {overdue.slice(0, 8).map((inv) => (
              <li key={inv.id}>
                {inv.invoice_number ?? inv.id} · due{" "}
                {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-AU") : "—"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm !text-red-800/90 dark:!text-red-200/90">No overdue invoices.</p>
        )}
      </article>
      <article className="dashboard-card overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-primary)]">
              <th className="px-2 py-2">Invoice #</th><th className="px-2 py-2">Amount</th><th className="px-2 py-2">Due</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const badge = getStatusBadge(invoice);
              const demo = Boolean(invoice.is_demo);
              return (
              <tr key={invoice.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-primary)]">
                <td className="px-2 py-2 text-[var(--text-primary)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{invoice.invoice_number ?? "-"}</span>
                    {demo ? <DemoBadge /> : null}
                  </div>
                </td>
                <td className="px-2 py-2 text-[var(--text-primary)]">${Number(invoice.amount ?? 0).toFixed(2)}</td>
                <td className="px-2 py-2 text-[var(--text-secondary)]">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-"}</td>
                <td className="px-2 py-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-2 py-2 space-x-2">
                  {!demo ? (
                    <>
                      <button type="button" onClick={() => startEdit(invoice)} className="rounded border px-2 py-1 text-xs">Edit</button>
                      <button type="button" onClick={() => downloadPdf(invoice)} className="rounded border px-2 py-1 text-xs">Download PDF</button>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Demo — preview only</span>
                  )}
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{editingId ? "Edit Invoice" : "New Invoice"}</h2>
            <form action={action} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={editingId} />
              <input type="hidden" name="line_items" value={JSON.stringify(lineItems)} />
              <div className="grid gap-3 sm:grid-cols-3">
                <select name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-10 rounded border px-3">
                  <option value="">Select client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input value={nextInvoiceNumber} readOnly className="h-10 rounded border bg-slate-50 px-3" />
                <input type="date" name="issue_date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-10 rounded border px-3" />
                <input type="date" name="due_date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 rounded border px-3" />
              </div>
              {!editingId ? (
                <div className="space-y-2 rounded border p-3">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid gap-2 sm:grid-cols-4">
                      <input value={item.description} onChange={(e) => setLineItems((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="Description" className="h-10 rounded border px-3 sm:col-span-2" />
                      <input type="number" value={item.quantity} onChange={(e) => setLineItems((prev) => prev.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} className="h-10 rounded border px-3" />
                      <input type="number" step="0.01" value={item.unit_price} onChange={(e) => setLineItems((prev) => prev.map((x, i) => i === idx ? { ...x, unit_price: Number(e.target.value) } : x))} className="h-10 rounded border px-3" />
                      <label className="sm:col-span-4 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={item.gst_applicable} onChange={(e) => setLineItems((prev) => prev.map((x, i) => i === idx ? { ...x, gst_applicable: e.target.checked } : x))} />GST applicable</label>
                      <button
                        type="button"
                        onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="sm:col-span-4 rounded border px-2 py-1 text-xs"
                        disabled={lineItems.length === 1}
                      >
                        Remove Row
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setLineItems((prev) => [...prev, { ...emptyLine }])} className="rounded border px-3 py-2 text-sm">Add line item</button>
                  <p className="text-sm text-slate-400">Subtotal: ${subTotal.toFixed(2)} | GST: ${gst.toFixed(2)} | Total: ${(subTotal + gst).toFixed(2)}</p>
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">{editingId ? "Save" : "Create Invoice"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


