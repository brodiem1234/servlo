"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { useUndoToast } from "@/hooks/useUndoToast";
import { PricebookAutocomplete, type PricebookSuggestion } from "@/components/dashboard/pricebook-autocomplete";

type Invoice = {
  id: string;
  invoice_number: string | null;
  client_id: string | null;
  total: number | null;
  subtotal?: number | null;
  gst?: number | null;
  status: string | null;
  due_date: string | null;
  issue_date: string | null;
  is_demo?: boolean | null;
  notes?: string | null;
};

type ClientRef = { id: string; label: string };
type LineItem = { description: string; quantity: number; unit_price: number; gst_applicable: boolean };
type QuickCreateResult = { ok: boolean; id?: string; label?: string; message?: string };

type Props = {
  invoices: Invoice[];
  clients: ClientRef[];
  createInvoiceAction: (formData: FormData) => Promise<void>;
  updateInvoiceAction: (formData: FormData) => Promise<void>;
  markPaidAction: (formData: FormData) => Promise<void>;
  sendInvoiceEmailAction: (formData: FormData) => Promise<void>;
  loadLineItemsAction: (invoiceId: string) => Promise<LineItem[]>;
  quickCreateClientForInvoiceAction: (formData: FormData) => Promise<QuickCreateResult>;
  prefill?: {
    prefill_client_id?: string;
    prefill_title?: string;
    prefill_date?: string;
    prefill_job_id?: string;
  };
  initialBucket?: string | null;
  businessProfile?: {
    businessName: string | null;
    abn: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  appOrigin?: string;
  deleteInvoiceAction?: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  restoreInvoiceAction?: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  pricebookItems?: PricebookSuggestion[];
};

const emptyLine: LineItem = { description: "", quantity: 1, unit_price: 0, gst_applicable: true };

function InvoiceRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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

function classifyInvoiceBucket(invoice: Invoice): "draft" | "unpaid" | "overdue" | "paid" {
  const status = (invoice.status ?? "").toLowerCase();
  if (status === "paid") return "paid";
  const overdue =
    status !== "paid" &&
    Boolean(invoice.due_date) &&
    new Date(invoice.due_date as string).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  if (overdue) return "overdue";
  if (status === "draft") return "draft";
  return "unpaid";
}

function getStatusBadgeInfo(invoice: Invoice) {
  const status = (invoice.status ?? "").toLowerCase();
  if (status === "paid")
    return { label: "Paid", className: "border border-emerald-600/40 bg-emerald-100 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950 dark:text-emerald-100" };
  const overdue =
    Boolean(invoice.due_date) &&
    new Date(invoice.due_date as string).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  if (overdue)
    return { label: "Overdue", className: "border border-red-600/70 bg-red-100 text-red-900 dark:border-red-400 dark:bg-red-950 dark:text-red-100" };
  if (status === "draft")
    return { label: "Draft", className: "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" };
  return { label: "Unpaid", className: "border border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-100" };
}

export default function InvoicesManager({
  invoices,
  clients,
  createInvoiceAction,
  updateInvoiceAction,
  markPaidAction,
  sendInvoiceEmailAction,
  loadLineItemsAction,
  quickCreateClientForInvoiceAction,
  prefill,
  initialBucket,
  businessProfile,
  appOrigin,
  deleteInvoiceAction,
  restoreInvoiceAction,
  pricebookItems = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [partialPaymentInvoice, setPartialPaymentInvoice] = useState<Invoice | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialMethod, setPartialMethod] = useState("bank_transfer");
  const [partialRef, setPartialRef] = useState("");
  const [partialDate, setPartialDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState(false);
  const [removedInvoiceIds, setRemovedInvoiceIds] = useState<Set<string>>(new Set());
  const { showUndo: showInvoiceUndo } = useUndoToast();

  // Local client list — gets new clients appended without a page reload
  const [localClients, setLocalClients] = useState<ClientRef[]>(clients);
  useEffect(() => setLocalClients(clients), [clients]);

  // Track whether the user clicked "Create & Send" vs "Save as Draft"
  const sendIntentRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Quick-create client modal state
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [savingNewClient, setSavingNewClient] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!prefill?.prefill_client_id) return;
    setEditingId("");
    setEditingInvoice(null);
    setClientId(prefill.prefill_client_id);
    const d = prefill.prefill_date?.slice(0, 10) ?? "";
    setIssueDate(d);
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setDueDate(d || due.toISOString().slice(0, 10));
    setNotes("");
    setLineItems([{ ...emptyLine, description: prefill.prefill_title ?? "Job invoice" }]);
    setOpen(true);
  }, [prefill]);

  const subTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [lineItems]
  );
  const gst = useMemo(
    () => lineItems.reduce((sum, item) => sum + (item.gst_applicable ? item.quantity * item.unit_price * 0.1 : 0), 0),
    [lineItems]
  );

  function startCreate() {
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setEditingId("");
    setEditingInvoice(null);
    setClientId("");
    setIssueDate(today);
    setDueDate(due.toISOString().slice(0, 10));
    setNotes("");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
  }

  async function startEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setEditingInvoice(invoice);
    setClientId(invoice.client_id ?? "");
    setIssueDate(invoice.issue_date ? invoice.issue_date.slice(0, 10) : "");
    setDueDate(invoice.due_date ? invoice.due_date.slice(0, 10) : "");
    setNotes(invoice.notes ?? "");
    setLineItems([{ ...emptyLine }]);
    setOpen(true);
    try {
      const items = await loadLineItemsAction(invoice.id);
      if (items.length > 0) setLineItems(items);
    } catch { /* silent */ }
  }

  const action = async (fd: FormData) => {
    fd.set("send_immediately", sendIntentRef.current ? "true" : "false");
    try {
      if (editingId) await updateInvoiceAction(fd);
      else await createInvoiceAction(fd);
      const msg = editingId
        ? "Invoice updated"
        : sendIntentRef.current
        ? "Invoice created and sent"
        : "Invoice saved as draft";
      setToast({ type: "success", message: msg });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save invoice" });
      console.error(error);
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
      const result = await quickCreateClientForInvoiceAction(fd);
      if (result.ok && result.id) {
        const newEntry = { id: result.id, label: result.label ?? name };
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

  const filteredInvoices = useMemo(() => {
    const key = (initialBucket ?? "").toLowerCase().trim();
    const base = invoices.filter((inv) => !removedInvoiceIds.has(inv.id));
    if (!key || !["draft", "unpaid", "overdue", "paid"].includes(key)) return base;
    return base.filter((inv) => classifyInvoiceBucket(inv) === key);
  }, [invoices, initialBucket, removedInvoiceIds]);

  const overdue = useMemo(
    () =>
      invoices.filter((inv) => {
        if (!inv.due_date || (inv.status ?? "").toLowerCase() === "paid") return false;
        return new Date(inv.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
      }),
    [invoices]
  );

  const handleRecordPartialPayment = async () => {
    if (!partialPaymentInvoice) return;
    const amt = parseFloat(partialAmount);
    if (isNaN(amt) || amt <= 0) {
      setToast({ type: "error", message: "Enter a valid payment amount" });
      return;
    }
    setRecordingPayment(true);
    try {
      const res = await fetch(`/api/invoices/${partialPaymentInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          payment_date: partialDate,
          payment_method: partialMethod,
          reference: partialRef.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to record payment");
      setToast({ type: "success", message: `Payment of ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amt)} recorded` });
      setPartialPaymentInvoice(null);
      setPartialAmount("");
      setPartialRef("");
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Payment failed" });
    } finally {
      setRecordingPayment(false);
    }
  };

  const downloadPdf = (invoice: Invoice) => {
    if (invoice.is_demo) return;
    const doc = new jsPDF();
    const bizName = businessProfile?.businessName ?? "My Business";
    const abn = businessProfile?.abn;
    const phone = businessProfile?.phone;
    const address = businessProfile?.address;
    const clientLabel = localClients.find((c) => c.id === invoice.client_id)?.label ?? "—";

    let y = 18;
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(bizName, 14, y);
    y += 6;
    if (abn) { doc.text(`ABN: ${abn}`, 14, y); y += 6; }
    if (phone) { doc.text(`Phone: ${phone}`, 14, y); y += 6; }
    if (address) { doc.text(address, 14, y); y += 6; }

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice #: ${invoice.invoice_number ?? "—"}`, 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    if (invoice.issue_date) { doc.text(`Issue date: ${new Date(invoice.issue_date).toLocaleDateString("en-AU")}`, 14, y); y += 6; }
    if (invoice.due_date) { doc.text(`Due date: ${new Date(invoice.due_date).toLocaleDateString("en-AU")}`, 14, y); y += 6; }

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Bill to:", 14, y);
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

    const invSubtotal = Number(invoice.subtotal ?? 0);
    const invGst = Number(invoice.gst ?? 0);
    const invTotal = Number(invoice.total ?? 0);

    if (invSubtotal > 0) {
      doc.text("Services rendered", 14, y);
      doc.text("1", 110, y, { align: "right" });
      doc.text(`$${invSubtotal.toFixed(2)}`, 145, y, { align: "right" });
      doc.text(invGst > 0 ? "10%" : "—", 165, y, { align: "right" });
      doc.text(`$${invTotal.toFixed(2)}`, 196, y, { align: "right" });
      y += 8;
    }

    doc.line(14, y, 196, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 145, y, { align: "right" });
    doc.text(`$${invSubtotal.toFixed(2)}`, 196, y, { align: "right" });
    y += 6;
    doc.text("GST (10%):", 145, y, { align: "right" });
    doc.text(`$${invGst.toFixed(2)}`, 196, y, { align: "right" });
    y += 6;
    doc.setFontSize(12);
    doc.text("TOTAL DUE:", 145, y, { align: "right" });
    doc.text(`$${invTotal.toFixed(2)}`, 196, y, { align: "right" });

    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business.", 14, y);
    if (invoice.notes) {
      y += 8;
      doc.text(`Notes: ${invoice.notes}`, 14, y);
    }

    doc.save(`${invoice.invoice_number ?? "invoice"}.pdf`);
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    if (invoice.is_demo || markingPaid) return;
    setMarkingPaid(invoice.id);
    const fd = new FormData();
    fd.set("id", invoice.id);
    try {
      await markPaidAction(fd);
      setToast({ type: "success", message: `${invoice.invoice_number ?? "Invoice"} marked as paid` });
    } catch {
      setToast({ type: "error", message: "Could not mark as paid" });
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (invoice.is_demo || sendingEmail) return;
    setSendingEmail(invoice.id);
    const fd = new FormData();
    fd.set("id", invoice.id);
    try {
      await sendInvoiceEmailAction(fd);
      setToast({ type: "success", message: "Invoice email sent" });
    } catch {
      setToast({ type: "error", message: "Email send failed" });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleCopyPayLink = async (invoice: Invoice) => {
    if (invoice.is_demo) return;
    const origin = appOrigin ?? window.location.origin;
    const url = `${origin}/pay/${invoice.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(invoice.id);
      setToast({ type: "success", message: "Payment link copied!" });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      setToast({ type: "error", message: "Could not copy link" });
    }
  };

  async function handleDeleteInvoiceConfirm() {
    if (!deleteInvoiceTarget || !deleteInvoiceAction) return;
    setDeletingInvoice(true);
    const fd = new FormData(); fd.set("id", deleteInvoiceTarget.id);
    const result = await deleteInvoiceAction(fd);
    setDeletingInvoice(false);
    if (!result.ok) { setDeleteInvoiceTarget(null); return; }
    const deletedId = deleteInvoiceTarget.id;
    const deletedNum = deleteInvoiceTarget.invoice_number ?? "Invoice";
    setRemovedInvoiceIds((prev) => new Set([...prev, deletedId]));
    setDeleteInvoiceTarget(null);
    showInvoiceUndo({
      message: `${deletedNum} deleted.`,
      onUndo: async () => {
        if (!restoreInvoiceAction) return;
        const rfd = new FormData(); rfd.set("id", deletedId);
        await restoreInvoiceAction(rfd);
        setRemovedInvoiceIds((prev) => { const n = new Set(prev); n.delete(deletedId); return n; });
      },
    });
  }

  return (
    <div className="space-y-4">
      <DeleteConfirmModal
        isOpen={!!deleteInvoiceTarget}
        onClose={() => setDeleteInvoiceTarget(null)}
        onConfirm={handleDeleteInvoiceConfirm}
        entityName={deleteInvoiceTarget?.invoice_number ?? "this invoice"}
        entityType="invoice"
        loading={deletingInvoice}
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
          onClick={startCreate}
          className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)]"
        >
          New Invoice
        </button>
      </div>

      {(initialBucket ?? "").trim() ? (
        <p className="text-xs text-[var(--text-muted)]">
          Showing <strong className="text-[var(--text-primary)]">{(initialBucket ?? "").trim()}</strong> invoices ·{" "}
          <a href="/dashboard/owner/invoices" className="font-semibold text-[var(--accent-color)] hover:underline">
            Clear filter
          </a>
        </p>
      ) : null}

      {overdue.length > 0 ? (
        <article className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/60">
          <h2 className="font-semibold text-red-900 dark:text-red-100">Overdue invoices ({overdue.length})</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-red-800 dark:text-red-200">
            {overdue.slice(0, 8).map((inv) => (
              <li key={inv.id}>
                <span className="inline-flex items-center gap-2">
                  <span>{inv.invoice_number ?? inv.id}</span>
                  {inv.is_demo ? <DemoBadge /> : null}
                </span>{" "}
                — due {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-AU") : "—"} — ${Number(inv.total ?? 0).toFixed(2)}
              </li>
            ))}
          </ul>
        </article>
      ) : (
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          ✓ No overdue invoices
        </article>
      )}

      <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-2 py-3">Invoice #</th>
              <th className="px-2 py-3">Client</th>
              <th className="px-2 py-3">Amount</th>
              <th className="px-2 py-3">Due</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Actions</th>
              <th className="px-2 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-10 text-center text-sm text-[var(--text-muted)]">
                  {invoices.length === 0 ? "No invoices yet. Create your first invoice above." : "No invoices match this filter."}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const badge = getStatusBadgeInfo(invoice);
                const demo = Boolean(invoice.is_demo);
                const clientLabel = localClients.find((c) => c.id === invoice.client_id)?.label;
                return (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-primary)]"
                    onClick={() => startEdit(invoice)}
                  >
                    <td className="px-2 py-3 font-mono text-xs font-semibold text-[var(--text-muted)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[var(--text-primary)]">{invoice.invoice_number ?? "-"}</span>
                        {demo ? <DemoBadge /> : null}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-[var(--text-secondary)]">{clientLabel ?? "—"}</td>
                    <td className="px-2 py-3 font-semibold text-[var(--text-primary)]">
                      ${Number(invoice.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-[var(--text-secondary)]">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      {!demo ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(invoice)}
                            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadPdf(invoice)}
                            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                          >
                            PDF
                          </button>
                          {(invoice.status ?? "").toLowerCase() !== "paid" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(invoice)}
                                disabled={markingPaid === invoice.id}
                                className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-200 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
                              >
                                {markingPaid === invoice.id ? "…" : "Mark Paid"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPartialPaymentInvoice(invoice)}
                                className="rounded border border-sky-300 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200"
                                title="Record a partial payment"
                              >
                                Part Pay
                              </button>
                            </>
                          ) : null}
                          {invoice.client_id ? (
                            <button
                              type="button"
                              onClick={() => handleSendEmail(invoice)}
                              disabled={sendingEmail === invoice.id}
                              className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
                            >
                              {sendingEmail === invoice.id ? "Sending…" : "Email"}
                            </button>
                          ) : null}
                          {!invoice.is_demo ? (
                            <button
                              type="button"
                              onClick={() => handleCopyPayLink(invoice)}
                              className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                              title="Copy payment link to share with client"
                            >
                              {copiedLink === invoice.id ? "Copied!" : "Pay link"}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Demo</span>
                      )}
                    </td>
                    <td className="px-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                      {!demo && deleteInvoiceAction ? (
                        <InvoiceRowMenu
                          onEdit={() => startEdit(invoice)}
                          onDelete={() => setDeleteInvoiceTarget(invoice)}
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
          <div className="relative ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--border)] bg-white dark:bg-[#1e2433] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editingId ? `Edit Invoice ${editingInvoice?.invoice_number ?? ""}` : "New Invoice"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
            </div>
            <form ref={formRef} action={action} className="space-y-5">
              <input type="hidden" name="id" value={editingId} />
              <input type="hidden" name="line_items" value={JSON.stringify(lineItems)} />

              <div className="grid gap-3 sm:grid-cols-2">
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
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="issue_date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                    required
                  />
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
                  placeholder="Payment instructions, bank details, terms…"
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
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white dark:bg-[#1e2433] p-6 shadow-2xl">
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

      {/* Partial payment modal */}
      {partialPaymentInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Record partial payment">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1e2433] p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Record Payment</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Invoice {partialPaymentInvoice.invoice_number ?? ""} — Total:{" "}
              <strong>{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(partialPaymentInvoice.total ?? 0)}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Amount Paid (AUD) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Payment Date</label>
                <input
                  type="date"
                  value={partialDate}
                  onChange={(e) => setPartialDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Payment Method</label>
                <select
                  value={partialMethod}
                  onChange={(e) => setPartialMethod(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="direct_debit">Direct Debit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Reference (optional)</label>
                <input
                  type="text"
                  value={partialRef}
                  onChange={(e) => setPartialRef(e.target.value)}
                  placeholder="BSB, transaction ID, etc."
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setPartialPaymentInvoice(null); setPartialAmount(""); setPartialRef(""); }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!partialAmount || recordingPayment}
                onClick={handleRecordPartialPayment}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {recordingPayment ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
