"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { useUndoToast } from "@/hooks/useUndoToast";
import { PricebookAutocomplete, type PricebookSuggestion } from "@/components/dashboard/pricebook-autocomplete";

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
type QuickCreateResult = { ok: boolean; id?: string; label?: string; message?: string };

type Props = {
  quotes: Quote[];
  clients: ClientRef[];
  createQuoteAction: (formData: FormData) => Promise<void>;
  updateQuoteAction: (formData: FormData) => Promise<void>;
  updateQuoteStatusAction: (formData: FormData) => Promise<void>;
  acceptQuoteAction: (formData: FormData) => Promise<{ jobId?: string }>;
  convertToInvoiceAction: (formData: FormData) => Promise<void>;
  sendQuoteEmailAction: (formData: FormData) => Promise<void>;
  loadQuoteItemsAction: (quoteId: string) => Promise<LineItem[]>;
  quickCreateClientForQuoteAction: (formData: FormData) => Promise<QuickCreateResult>;
  initialBucket?: string | null;
  businessProfile?: { businessName: string | null; abn: string | null } | null;
  deleteQuoteAction?: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  restoreQuoteAction?: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  pricebookItems?: PricebookSuggestion[];
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
  if (s === "accepted") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  if (s === "declined" || s === "cancelled") return "bg-red-500/15 text-red-400 border border-red-500/20";
  if (s === "sent" || s === "awaiting") return "bg-sky-500/15 text-sky-400 border border-sky-500/20";
  return "bg-slate-800 text-slate-200 border border-slate-600";
}

function QuoteRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-primary)] transition-colors" aria-label="Row actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg">
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">
            <Pencil size={14} />Edit
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 size={14} />Delete
          </button>
        </div>
      )}
    </div>
  );
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
  quickCreateClientForQuoteAction,
  initialBucket,
  businessProfile,
  deleteQuoteAction,
  restoreQuoteAction,
  pricebookItems = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Local client list — appends newly quick-created clients without page reload
  const [localClients, setLocalClients] = useState<ClientRef[]>(clients);
  useEffect(() => setLocalClients(clients), [clients]);

  const sendIntentRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Quick-create client modal
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [deleteQuoteTarget, setDeleteQuoteTarget] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState(false);
  const [removedQuoteIds, setRemovedQuoteIds] = useState<Set<string>>(new Set());
  const { showUndo: showQuoteUndo } = useUndoToast();
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [savingNewClient, setSavingNewClient] = useState(false);

  // AI Draft modal
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const generateAiDraft = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: aiPrompt }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message ?? "Generation failed");
      }
      const d = await res.json() as { title?: string; description?: string; line_items?: Array<{ description: string; quantity: number; unit_price: number }> };
      // Pre-fill the quote form
      if (d.line_items && d.line_items.length > 0) {
        setLineItems(d.line_items.map((li) => ({ description: li.description, quantity: li.quantity, unit_price: li.unit_price, gst_applicable: true })));
      }
      setNotes(d.description ?? "");
      setAiDraftOpen(false);
      setAiPrompt("");
      // Open the create form
      startNew();
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "AI generation failed" });
    } finally {
      setAiGenerating(false);
    }
  };

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
    const base = quotes.filter((q) => !removedQuoteIds.has(q.id));
    if (!key || !["draft", "awaiting", "accepted", "declined"].includes(key)) return base;
    return base.filter((q) => classifyQuoteBucket(q.status) === key);
  }, [quotes, initialBucket, removedQuoteIds]);

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
    fd.set("send_immediately", sendIntentRef.current ? "true" : "false");
    try {
      if (editingId) await updateQuoteAction(fd);
      else await createQuoteAction(fd);
      const msg = editingId
        ? "Quote updated"
        : sendIntentRef.current
        ? "Quote created and sent"
        : "Quote saved as draft";
      setToast({ type: "success", message: msg });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save quote" });
      console.error(error);
    }
  };

  const handleShareLink = async (quote: Quote) => {
    if (quote.is_demo || sharingId) return;
    setSharingId(quote.id);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/token`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate link");
      await navigator.clipboard.writeText(json.url);
      setToast({ type: "success", message: "Share link copied to clipboard!" });
    } catch {
      setToast({ type: "error", message: "Could not copy share link" });
    } finally {
      setSharingId(null);
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

  const handleQuickCreateClient = async () => {
    const name = newClientName.trim();
    if (!name) return;
    setSavingNewClient(true);
    const fd = new FormData();
    fd.set("full_name", name);
    fd.set("email", newClientEmail.trim());
    fd.set("phone", newClientPhone.trim());
    try {
      const result = await quickCreateClientForQuoteAction(fd);
      if (result.ok && result.id) {
        const newEntry: ClientRef = { id: result.id, label: result.label ?? name };
        setLocalClients((prev) => [...prev, newEntry]);
        setClientId(result.id);
        setNewClientOpen(false);
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPhone("");
        setToast({ type: "success", message: `Client "${result.label ?? name}" added` });
      } else {
        setToast({ type: "error", message: result.message ?? "Could not create client" });
      }
    } catch {
      setToast({ type: "error", message: "Could not create client" });
    } finally {
      setSavingNewClient(false);
    }
  };

  const downloadPdf = (quote: Quote) => {
    if (quote.is_demo) return;
    const doc = new jsPDF();
    const bizName = businessProfile?.businessName ?? "My Business";
    const abn = businessProfile?.abn;
    const clientLabel = localClients.find((c) => c.id === quote.client_id)?.label ?? quote.client_name ?? "—";

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

  async function handleDeleteQuoteConfirm() {
    if (!deleteQuoteTarget || !deleteQuoteAction) return;
    setDeletingQuote(true);
    const fd = new FormData(); fd.set("id", deleteQuoteTarget.id);
    const result = await deleteQuoteAction(fd);
    setDeletingQuote(false);
    if (!result.ok) { setDeleteQuoteTarget(null); return; }
    const deletedId = deleteQuoteTarget.id;
    const deletedNum = deleteQuoteTarget.quote_number ?? "Quote";
    setRemovedQuoteIds((prev) => new Set([...prev, deletedId]));
    setDeleteQuoteTarget(null);
    showQuoteUndo({
      message: `${deletedNum} deleted.`,
      onUndo: async () => {
        if (!restoreQuoteAction) return;
        const rfd = new FormData(); rfd.set("id", deletedId);
        await restoreQuoteAction(rfd);
        setRemovedQuoteIds((prev) => { const n = new Set(prev); n.delete(deletedId); return n; });
      },
    });
  }

  return (
    <div className="space-y-4">
      <DeleteConfirmModal
        isOpen={!!deleteQuoteTarget}
        onClose={() => setDeleteQuoteTarget(null)}
        onConfirm={handleDeleteQuoteConfirm}
        entityName={deleteQuoteTarget?.quote_number ?? "this quote"}
        entityType="quote"
        loading={deletingQuote}
      />
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
        <button
          type="button"
          onClick={() => setAiDraftOpen(true)}
          className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-1.5"
        >
          <span aria-hidden>✨</span> AI Draft
        </button>
      </div>

      {/* AI Draft modal */}
      {aiDraftOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Quote Draft</h2>
            <p className="mb-3 text-sm text-[var(--text-muted)]">Describe the job and Claude will generate line items and a description.</p>
            <textarea
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Replace hot water system, 25L electric unit, 2-storey house in Canberra"
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={!aiPrompt.trim() || aiGenerating}
                onClick={generateAiDraft}
                className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {aiGenerating ? "Generating…" : <><span aria-hidden>✨</span> Generate</>}
              </button>
              <button
                type="button"
                onClick={() => { setAiDraftOpen(false); setAiPrompt(""); }}
                className="rounded-md border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
              <th className="px-2 py-3 w-8" />
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
                const clientLabel = localClients.find((c) => c.id === quote.client_id)?.label ?? quote.client_name ?? "—";
                const clientEmail = localClients.find((c) => c.id === quote.client_id)?.email;
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
                          <button
                            type="button"
                            onClick={() => handleShareLink(quote)}
                            disabled={!!sharingId}
                            title="Copy shareable quote link for client to review and sign"
                            className="rounded border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200 disabled:opacity-60"
                          >
                            {sharingId === quote.id ? "Copying…" : "🔗 Share"}
                          </button>
                          <button
                            type="button"
                            className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
                            onClick={async () => {
                              const fd = new FormData();
                              fd.set("quote_id", quote.id);
                              try {
                                const result = await acceptQuoteAction(fd);
                                if (result?.jobId) {
                                  setToast({ type: "success", message: "Quote accepted — job created." });
                                }
                              } catch {
                                setToast({ type: "error", message: "Failed to accept quote." });
                              }
                            }}
                          >
                            Accept → Job
                          </button>
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
                    <td className="px-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                      {!demo && deleteQuoteAction ? (
                        <QuoteRowMenu
                          onEdit={() => startEdit(quote)}
                          onDelete={() => setDeleteQuoteTarget(quote)}
                        />
                      ) : null}
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
          <div className="relative ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--border)] bg-[#1e2433] p-6 shadow-2xl">
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

            <form ref={formRef} action={onSubmit} className="space-y-5">
              <input type="hidden" name="id" value={editingId} />
              <input type="hidden" name="line_items" value={JSON.stringify(lineItems)} />

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Client
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewClientOpen(true)}
                    className="text-xs font-medium text-[var(--accent-color)] hover:underline"
                  >
                    + New Client
                  </button>
                </div>
                <select
                  name="client_id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                  required
                >
                  <option value="">Select client…</option>
                  {localClients.map((c) => (
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
                            <td className="px-2 py-1.5 min-w-[160px]">
                              <PricebookAutocomplete
                                value={item.description}
                                onChange={(v) =>
                                  setLineItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, description: v } : x))
                                  )
                                }
                                onSelect={(pb) =>
                                  setLineItems((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? { ...x, description: pb.name, unit_price: pb.unit_price, gst_applicable: true }
                                        : x
                                    )
                                  )
                                }
                                items={pricebookItems}
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
                {editingId ? (
                  <button
                    type="submit"
                    onClick={() => { sendIntentRef.current = false; }}
                    className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                  >
                    Save Changes
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      onClick={() => { sendIntentRef.current = false; }}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="submit"
                      onClick={() => { sendIntentRef.current = true; }}
                      className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                    >
                      Create &amp; Send
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Quick-create client modal */}
      {newClientOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[#1e2433] p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Add New Client</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Full name or company"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="04xx xxx xxx"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setNewClientOpen(false); setNewClientName(""); setNewClientEmail(""); setNewClientPhone(""); }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newClientName.trim() || savingNewClient}
                onClick={handleQuickCreateClient}
                className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {savingNewClient ? "Saving…" : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
