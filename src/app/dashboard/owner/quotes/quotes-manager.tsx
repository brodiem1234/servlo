"use client";

import { useMemo, useState, useEffect } from "react";
import jsPDF from "jspdf";
import { DemoBadge } from "@/components/demo-badge";

type Quote = {
  id: string;
  quote_number: string | null;
  client_id: string | null;
  client_name: string | null;
  total: number | null;
  subtotal?: number | null;
  gst?: number | null;
  status: string | null;
  created_at: string | null;
  is_demo?: boolean | null;
  notes?: string | null;
};

type ClientRef = { id: string; label: string; email?: string | null };
type LineItem = { description: string; quantity: number; unit_price: number; gst_applicable: boolean };

type Props = {
  quotes: Quote[];
  clients: ClientRef[];
  createQuoteAction: (formData: FormData) => Promise<void>;
  updateQuoteAction: (formData: FormData) => Promise<void>;
  updateQuoteStatusAction: (formData: FormData) => Promise<void>;
  acceptQuoteAction: (formData: FormData) => Promise<void>;
  convertToInvoiceAction: (formData: FormData) => Promise<void>;
  sendQuoteEmailAction: (formData: FormData) => Promise<void>;
  loadQuoteItemsAction: (quoteId: string) => Promise<LineItem[]>;
  initialBucket?: string | null;
  businessProfile?: { businessName: string | null; abn: string | null } | null;
};

const emptyLine: LineItem = { description: "", quantity: 1, unit_price: 0, gst_applicable: true };

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  awaiting: "Awaiting Acceptance",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled"
};

function statusColor(status: string | null) {
  const s = (status ?? "draft").toLowerCase();
  if (s === "accepted") return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
  if (s === "declined" || s === "cancelled") return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100";
  if (s === "sent" || s === "awaiting") return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function classifyQuoteBucket(status: string | null): "draft" | "awaiting" | "accepted" | "declined" {
  const s = (status ?? "").toLowerCase();
  if (s === "draft") return "draft";
  if (s === "accepted") return "accepted";
  if (s === "declined" || s === "rejected" || s === "cancelled") return "declined";
  return "awaiting";
}

export default function QuotesManager({
  quotes,
  clients,
  createQuoteAction,
  updateQuoteAction,
  updateQuoteStatusAction,
  acceptQuoteAction,
  convertToInvoiceAction,
  sendQuoteEmailAction,
  loadQuoteItemsAction,
  initialBucket,
  businessProfile
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const subTotal = useMemo(
    () => lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    [lineItems]
  );
  const gst = useMemo(
    () => lineItems.reduce((s, i) => s + (i.gst_applicable ? i.quantity * i.unit_price * 0.1 : 0), 0),
    [lineItems]
  );

  const filteredQuotes = useMemo(() => {
    const key = (initialBucket ?? "").toLowerCase().trim();
    if (!key || !["draft", "awaiting", "accepted", "declined"].includes(key)) return quotes;
    return quotes.filter((q) => classifyQuoteBucket(q.status) === key);
  }, [quotes, initialBucket]);

  function startNew() {
    setEditingId("");
    setEditingQuote(null);
    setClientId("");
    setNotes("");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  async function startEdit(quote: Quote) {
    setEditingId(quote.id);
    setEditingQuote(quote);
    setClientId(quote.client_id ?? "");
    setNotes(quote.notes ?? "");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
    try {
      const items = await loadQuoteItemsAction(quote.id);
      if (items.length > 0) setLineItems(items);
    } catch { /* silent */ }
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

  const handleSendEmail = async (quote: Quote) => {
    if (quote.is_demo || sendingEmail) return;
    setSendingEmail(quote.id);
    const fd = new FormData();
    fd.set("quote_id", quote.id);
    try {
      await sendQuoteEmailAction(fd);
      setToast({ type: "success", message: "Quote email sent" });
    } catch {
      setToast({ type: "error", message: "Email send failed" });
    } finally {
      setSendingEmail(null);
    }
  };

  const downloadPdf = (quote: Quote) => {
    if (quote.is_demo) return;
    const doc = new jsPDF();
    const bizName = businessProfile?.businessName ?? "My Business";
    const abn = businessProfile?.abn;
    const clientLabel = clients.find((c) => c.id === quote.client_id)?.label ?? quote.client_name ?? "—";

    let y = 18;
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTE", 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(bizName, 14, y);
    y += 6;
    if (abn) { doc.text(`ABN: ${abn}`, 14, y); y += 6; }

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text(`Quote #: ${quote.quote_number ?? "—"}`, 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${quote.created_at ? new Date(quote.created_at).toLocaleDateString("en-AU") : new Date().toLocaleDateString("en-AU")}`, 14, y);
    y += 6;
    doc.text(`Status: ${STATUS_LABELS[quote.status ?? "draft"] ?? quote.status ?? "Draft"}`, 14, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Prepared for:", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(clientLabel, 14, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Description", 14, y);
    doc.text("Qty", 110, y, { align: "right" });
    doc.text("Unit Price", 145, y, { align: "right" });
    doc.text("GST", 165, y, { align: "right" });
    doc.text("Total", 196, y, { align: "right" });
    doc.line(14, y + 2, 196, y + 2);
    y += 8;
    doc.setFont("helvetica", "normal");

    const subtotal = Number(quote.subtotal ?? quote.total ?? 0);
    const gstVal = Number(quote.gst ?? 0);
    const total = subtotal + gstVal;

    doc.text("Services / materials", 14, y);
    doc.text("1", 110, y, { align: "right" });
    doc.text(`$${subtotal.toFixed(2)}`, 145, y, { align: "right" });
    doc.text(gstVal > 0 ? "10%" : "—", 165, y, { align: "right" });
    doc.text(`$${total.toFixed(2)}`, 196, y, { align: "right" });
    y += 10;

    doc.line(14, y, 196, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 145, y, { align: "right" });
    doc.text(`$${subtotal.toFixed(2)}`, 196, y, { align: "right" });
    y += 6;
    doc.text("GST (10%):", 145, y, { align: "right" });
    doc.text(`$${gstVal.toFixed(2)}`, 196, y, { align: "right" });
    y += 6;
    doc.setFontSize(12);
    doc.text("TOTAL:", 145, y, { align: "right" });
    doc.text(`$${total.toFixed(2)}`, 196, y, { align: "right" });

    if (quote.notes) {
      y += 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Notes: ${quote.notes}`, 14, y);
    }

    doc.save(`${quote.quote_number ?? "quote"}.pdf`);
  };

  const QUOTE_STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "awaiting", label: "Awaiting Acceptance" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "cancelled", label: "Cancelled" }
  ];

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={startNew}
          className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)]"
        >
          New Quote
        </button>
      </div>

      {(initialBucket ?? "").trim() ? (
        <p className="text-xs text-[var(--text-muted)]">
          Showing <strong className="text-[var(--text-primary)]">{(initialBucket ?? "").trim()}</strong> quotes ·{" "}
          <a href="/dashboard/owner/quotes" className="font-semibold text-[var(--accent-color)] hover:underline">
            Clear filter
          </a>
        </p>
      ) : null}

      <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-2 py-3">Quote #</th>
              <th className="px-2 py-3">Client</th>
              <th className="px-2 py-3">Total</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-10 text-center text-sm text-[var(--text-muted)]">
                  {quotes.length === 0 ? "No quotes yet. Create your first quote above." : "No quotes match this filter."}
                </td>
              </tr>
            ) : (
              filteredQuotes.map((quote) => {
                const demo = Boolean(quote.is_demo);
                const clientLabel = clients.find((c) => c.id === quote.client_id)?.label ?? quote.client_name ?? "—";
                const clientEmail = clients.find((c) => c.id === quote.client_id)?.email;
                return (
                  <tr
                    key={quote.id}
                    className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-primary)]"
                    onClick={() => !demo && startEdit(quote)}
                  >
                    <td className="px-2 py-3 font-mono text-xs font-semibold">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[var(--text-muted)]">{quote.quote_number ?? "-"}</span>
                        {demo ? <DemoBadge /> : null}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-[var(--text-secondary)]">{clientLabel}</td>
                    <td className="px-2 py-3 font-semibold text-[var(--text-primary)]">
                      ${Number(quote.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-3">
                      {!demo ? (
                        <form action={updateQuoteStatusAction} onClick={(e) => e.stopPropagation()}>
                          <input type="hidden" name="quote_id" value={quote.id} />
                          <select
                            name="status"
                            defaultValue={quote.status ?? "draft"}
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(quote.status)}`}
                          >
                            {QUOTE_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </form>
                      ) : (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(quote.status)}`}>
                          {STATUS_LABELS[quote.status ?? "draft"] ?? quote.status ?? "Draft"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      {!demo ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(quote)}
                            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadPdf(quote)}
                            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                          >
                            PDF
                          </button>
                          {clientEmail ? (
                            <button
                              type="button"
                              onClick={() => handleSendEmail(quote)}
                              disabled={sendingEmail === quote.id}
                              className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
                            >
                              {sendingEmail === quote.id ? "Sending…" : "Send"}
                            </button>
                          ) : null}
                          <form action={acceptQuoteAction}>
                            <input type="hidden" name="quote_id" value={quote.id} />
                            <button
                              type="submit"
                              className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
                            >
                              Accept → Job
                            </button>
                          </form>
                          <form action={convertToInvoiceAction}>
                            <input type="hidden" name="quote_id" value={quote.id} />
                            <button
                              type="submit"
                              className="rounded bg-[var(--accent-color)] px-2 py-1 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                            >
                              → Invoice
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Demo</span>
                      )}
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
          <div className="relative ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editingId ? `Edit Quote ${editingQuote?.quote_number ?? ""}` : "New Quote"}
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

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Client
                </label>
                <select
                  name="client_id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                  required
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
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
                  <table className="w-full min-w-[580px] text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[var(--text-muted)]">
                        <th className="px-3 py-2 font-semibold">Description</th>
                        <th className="px-2 py-2 font-semibold">Qty</th>
                        <th className="px-2 py-2 font-semibold">Unit Price</th>
                        <th className="px-2 py-2 font-semibold">GST</th>
                        <th className="px-2 py-2 font-semibold">Line Total</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => {
                        const lineTotal = item.quantity * item.unit_price;
                        return (
                          <tr key={idx} className="border-b border-[var(--border)] last:border-0">
                            <td className="px-2 py-1.5">
                              <input
                                value={item.description}
                                onChange={(e) =>
                                  setLineItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                                  )
                                }
                                placeholder="Description"
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
                                className="h-8 w-20 rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 text-xs text-[var(--text-primary)]"
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
                            <td className="px-2 py-1.5">
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={item.gst_applicable}
                                  onChange={(e) =>
                                    setLineItems((prev) =>
                                      prev.map((x, i) => (i === idx ? { ...x, gst_applicable: e.target.checked } : x))
                                    )
                                  }
                                  className="accent-[var(--accent-color)]"
                                />
                                <span className="text-[var(--text-secondary)]">10%</span>
                              </label>
                            </td>
                            <td className="px-2 py-1.5 font-semibold text-[var(--text-primary)]">
                              ${lineTotal.toFixed(2)}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-right text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span>${subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>GST (10%)</span>
                    <span>${gst.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-1 font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <span>${(subTotal + gst).toFixed(2)}</span>
                  </div>
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
                  placeholder="Validity period, payment terms, inclusions/exclusions…"
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
                  {editingId ? "Save Changes" : "Create Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
