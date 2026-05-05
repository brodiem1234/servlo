"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type Invoice = {
  id: string;
  invoice_number: string | null;
  client_id: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  issue_date: string | null;
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
    if (status === "paid") return { label: "Paid", className: "bg-green-100 text-green-700" };
    if (invoice.due_date && status !== "paid" && new Date(invoice.due_date) < new Date()) {
      return { label: "Overdue", className: "bg-orange-100 text-orange-700" };
    }
    return { label: "Unpaid", className: "bg-red-100 text-red-700" };
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
    if (!invoice.due_date) return false;
    return invoice.status !== "paid" && new Date(invoice.due_date) < new Date();
  });
  const nextInvoiceNumber = `INV-${String(invoices.length + 1).padStart(3, "0")}`;

  const downloadPdf = (invoice: Invoice) => {
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
      <article className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="font-semibold text-red-700">Overdue Invoices ({overdue.length})</h2>
      </article>
      <article className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b text-left text-[#1e3a5f]">
              <th className="px-2 py-2">Invoice #</th><th className="px-2 py-2">Amount</th><th className="px-2 py-2">Due</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-slate-50">
                <td className="px-2 py-2">{invoice.invoice_number ?? "-"}</td>
                <td className="px-2 py-2">${Number(invoice.amount ?? 0).toFixed(2)}</td>
                <td className="px-2 py-2">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-"}</td>
                <td className="px-2 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(invoice).className}`}>
                    {getStatusBadge(invoice).label}
                  </span>
                </td>
                <td className="px-2 py-2 space-x-2">
                  <button onClick={() => startEdit(invoice)} className="rounded border px-2 py-1 text-xs">Edit</button>
                  <button onClick={() => downloadPdf(invoice)} className="rounded border px-2 py-1 text-xs">Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100">{editingId ? "Edit Invoice" : "New Invoice"}</h2>
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


