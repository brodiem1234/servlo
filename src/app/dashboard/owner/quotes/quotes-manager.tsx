"use client";

import { useMemo, useState } from "react";

type Quote = {
  id: string;
  quote_number: string | null;
  client_id: string | null;
  client_name: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
};

type ClientRef = { id: string; label: string };
type LineItem = { description: string; quantity: number; unit_price: number; gst_applicable: boolean };

type Props = {
  quotes: Quote[];
  clients: ClientRef[];
  createQuoteAction: (formData: FormData) => Promise<void>;
  updateQuoteAction: (formData: FormData) => Promise<void>;
  acceptQuoteAction: (formData: FormData) => Promise<void>;
};

const emptyLine: LineItem = { description: "", quantity: 1, unit_price: 0, gst_applicable: true };

export default function QuotesManager({
  quotes,
  clients,
  createQuoteAction,
  updateQuoteAction,
  acceptQuoteAction
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [clientId, setClientId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-orange-100 text-orange-700"
  };

  const total = useMemo(() => {
    const sub = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const gst = lineItems.reduce((s, i) => s + (i.gst_applicable ? i.quantity * i.unit_price * 0.1 : 0), 0);
    return sub + gst;
  }, [lineItems]);

  function startNew() {
    setEditingId("");
    setClientId("");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  function startEdit(quote: Quote) {
    setEditingId(quote.id);
    setClientId(quote.client_id ?? "");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  const onSubmit = async (fd: FormData) => {
    try {
      if (editingId) await updateQuoteAction(fd);
      else await createQuoteAction(fd);
      setToast({ type: "success", message: editingId ? "Quote updated" : "Quote created" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save quote" });
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      <button onClick={startNew} className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white">
        New Quote
      </button>
      <article className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="px-2 py-2">Quote #</th><th className="px-2 py-2">Client</th><th className="px-2 py-2">Total</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Actions</th></tr></thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-b hover:bg-slate-50">
                <td className="px-2 py-2">{quote.quote_number ?? "-"}</td>
                <td className="px-2 py-2">{quote.client_name ?? "-"}</td>
                <td className="px-2 py-2">${Number(quote.total ?? 0).toFixed(2)}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      statusColors[quote.status ?? "draft"] ?? statusColors.draft
                    }`}
                  >
                    {quote.status ?? "draft"}
                  </span>
                </td>
                <td className="px-2 py-2 flex gap-2">
                  <button onClick={() => startEdit(quote)} className="rounded border px-2 py-1 text-xs">Edit</button>
                  <form action={acceptQuoteAction}>
                    <input type="hidden" name="quote_id" value={quote.id} />
                    <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Accept</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">{editingId ? "Edit Quote" : "New Quote"}</h2>
            <form action={onSubmit} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={editingId} />
              <input type="hidden" name="line_items" value={JSON.stringify(lineItems)} />
              <select name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-10 w-full rounded border px-3">
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
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
                        disabled={lineItems.length === 1}
                        className="sm:col-span-4 rounded border px-2 py-1 text-xs"
                      >
                        Remove Row
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setLineItems((prev) => [...prev, { ...emptyLine }])} className="rounded border px-3 py-2 text-sm">Add line item</button>
                  <p className="text-sm text-slate-600">Quote Total: ${total.toFixed(2)}</p>
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="rounded bg-[#1e3a5f] px-4 py-2 text-sm text-white">{editingId ? "Save" : "Create Quote"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

