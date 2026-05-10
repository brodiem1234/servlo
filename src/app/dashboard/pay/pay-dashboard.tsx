"use client";

import { useState, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  FileText,
  Download,
  Copy,
  Bell,
  Link2,
  Settings,
  CheckCircle,
} from "lucide-react";
import type { PayTransaction, OutstandingInvoice, PayStats } from "./page";

// ─── Toast ───────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string; type: "success" | "error" };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ${
            t.type === "success"
              ? "bg-emerald-900/90 border-emerald-500/30 text-emerald-100"
              : "bg-red-900/90 border-red-500/30 text-red-100"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
          ) : (
            <span className="text-red-400 shrink-0">✕</span>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

function methodBadge(method: string) {
  const m = method?.toLowerCase() ?? "";
  if (m === "card")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">Card</span>;
  if (m === "bank_transfer")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">Bank Transfer</span>;
  if (m === "cash")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">Cash</span>;
  if (m === "cheque")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">Cheque</span>;
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">{method}</span>;
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  if (s === "succeeded")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Succeeded</span>;
  if (s === "pending")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">Pending</span>;
  if (s === "failed")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">Failed</span>;
  if (s === "refunded")
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">Refunded</span>;
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">{status}</span>;
}

function daysDiff(dateStr: string | null): number {
  if (!dateStr) return 0;
  const today = new Date("2026-05-10");
  const due = new Date(dateStr);
  return Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  transactions: PayTransaction[];
  outstandingInvoices: OutstandingInvoice[];
  stats: PayStats;
};

type Tab = "transactions" | "outstanding" | "links" | "settings";

type PaymentLink = {
  id: string;
  url: string;
  amount: number;
  description: string;
  expiryDays: number;
  createdAt: string;
};

export function PayDashboard({ transactions, outstandingInvoices, stats }: Props) {
  const [tab, setTab] = useState<Tab>("transactions");
  const [txFilter, setTxFilter] = useState<string>("all");
  const { toasts, show } = useToast();

  // Payment links state (local only)
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [linkAmount, setLinkAmount] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("14");

  const [localTx, setLocalTx] = useState<PayTransaction[]>(transactions);
  const filteredTx =
    txFilter === "all" ? localTx : localTx.filter((t) => t.status === txFilter);

  // Add transaction modal state
  const [showAddTx, setShowAddTx] = useState(false);
  const [addTxAmount, setAddTxAmount] = useState("");
  const [addTxMethod, setAddTxMethod] = useState("card");
  const [addTxDesc, setAddTxDesc] = useState("");
  const [addTxSaving, setAddTxSaving] = useState(false);

  const handleAddTransaction = async () => {
    const amt = parseFloat(addTxAmount);
    if (!amt || isNaN(amt) || amt <= 0) { show("Enter a valid amount", "error"); return; }
    setAddTxSaving(true);
    try {
      const res = await fetch("/api/pay/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, payment_method: addTxMethod, description: addTxDesc || undefined }),
      });
      const data = await res.json() as { transaction?: PayTransaction };
      if (res.ok && data.transaction) {
        setLocalTx((prev) => [data.transaction!, ...prev]);
        show("Transaction recorded", "success");
        setShowAddTx(false);
        setAddTxAmount(""); setAddTxDesc(""); setAddTxMethod("card");
      } else {
        show("Failed to record transaction", "error");
      }
    } catch { show("Network error", "error"); }
    finally { setAddTxSaving(false); }
  };

  function exportCSV() {
    const rows = [
      "Date,Description,Method,Amount,Fee,Net,Status",
      ...filteredTx.map((t) =>
        [
          t.paid_at ? new Date(t.paid_at).toLocaleDateString("en-AU") : "",
          `"${(t.description ?? "").replace(/"/g, '""')}"`,
          t.payment_method,
          t.amount?.toFixed(2) ?? "",
          t.fee_amount?.toFixed(2) ?? "",
          t.net_amount?.toFixed(2) ?? "",
          t.status,
        ].join(",")
      ),
    ].join("\n");
    const url = window.URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "servlo-pay-transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function generateLink() {
    const amt = parseFloat(linkAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      show("Enter a valid amount", "error");
      return;
    }
    const shortId = Math.random().toString(36).slice(2, 10);
    const url = `https://pay.servlo.com.au/link/${shortId}`;
    const link: PaymentLink = {
      id: shortId,
      url,
      amount: amt,
      description: linkDesc || "Payment",
      expiryDays: parseInt(linkExpiry),
      createdAt: new Date().toLocaleDateString("en-AU"),
    };
    setLinks((prev) => [link, ...prev]);
    navigator.clipboard.writeText(url).catch(() => {});
    show(`Link copied! ${url}`);
    setLinkAmount("");
    setLinkDesc("");
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "transactions", label: "Transactions", icon: <FileText size={14} /> },
    { id: "outstanding", label: "Outstanding", icon: <Wallet size={14} /> },
    { id: "links", label: "Payment Links", icon: <Link2 size={14} /> },
    { id: "settings", label: "Settings", icon: <Settings size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              SERVLO PAY
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#052e16", color: "#22C55E", border: "1px solid #22C55E33" }}
            >
              Q2 2026 — Early Access
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Payment processing — lowest rates for Australian service businesses
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Processed (30d)", value: fmt(stats.totalProcessed), Icon: DollarSign },
          { label: "Processing Fees", value: fmt(stats.totalFees), Icon: TrendingUp },
          { label: "Net Received", value: fmt(stats.netReceived), Icon: Wallet },
          { label: "Outstanding Invoices", value: fmt(stats.outstandingInvoices), Icon: FileText },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#052e16" }}>
                <Icon size={15} style={{ color: "#22C55E" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
              style={
                tab === t.id
                  ? { color: "#22C55E", borderBottom: "2px solid #22C55E" }
                  : { color: "var(--text-muted)", borderBottom: "2px solid transparent" }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Transactions tab ── */}
        {tab === "transactions" && (
          <div>
            {/* toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Filter:</span>
                {["all", "succeeded", "pending", "failed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors"
                    style={
                      txFilter === f
                        ? { background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44" }
                        : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddTx(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors text-white"
                  style={{ background: "#22C55E" }}
                >
                  + Add Transaction
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ background: "#052e16", color: "#22C55E", border: "1px solid #22C55E33" }}
                >
                  <Download size={12} />
                  Export CSV
                </button>
              </div>
            </div>

            {filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <DollarSign size={32} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  No transactions yet. Accept your first payment to see it here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Date", "Description", "Method", "Amount", "Fee", "Net", "Status"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((t) => (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-white/5"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-5 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {t.paid_at ? new Date(t.paid_at).toLocaleDateString("en-AU") : "—"}
                        </td>
                        <td className="px-5 py-3 max-w-[180px] truncate" style={{ color: "var(--text-secondary)" }}>
                          {t.description ?? "—"}
                        </td>
                        <td className="px-5 py-3">{methodBadge(t.payment_method)}</td>
                        <td className="px-5 py-3 font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {fmt(t.amount)}
                        </td>
                        <td className="px-5 py-3 tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {t.fee_amount != null ? fmt(t.fee_amount) : "—"}
                        </td>
                        <td className="px-5 py-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {t.net_amount != null ? fmt(t.net_amount) : "—"}
                        </td>
                        <td className="px-5 py-3">{statusBadge(t.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Outstanding tab ── */}
        {tab === "outstanding" && (
          <div>
            {outstandingInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <CheckCircle size={32} style={{ color: "#22C55E" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  No outstanding invoices. Great work!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Invoice #", "Due Date", "Amount", "Days Overdue", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingInvoices.map((inv) => {
                      const diff = daysDiff(inv.due_date);
                      const isOverdue = diff > 0;
                      return (
                        <tr
                          key={inv.id}
                          className="transition-colors hover:bg-white/5"
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          <td className="px-5 py-3 font-mono text-xs" style={{ color: "#22C55E" }}>
                            {inv.invoice_number}
                          </td>
                          <td className="px-5 py-3 text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-AU") : "—"}
                          </td>
                          <td className="px-5 py-3 font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                            {fmt(inv.total)}
                          </td>
                          <td className="px-5 py-3 text-xs font-semibold tabular-nums">
                            {inv.due_date ? (
                              isOverdue ? (
                                <span className="text-red-400">{diff}d overdue</span>
                              ) : (
                                <span style={{ color: "#22C55E" }}>due in {Math.abs(diff)}d</span>
                              )
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => show(`Reminder sent for ${inv.invoice_number}`)}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                                style={{ background: "var(--border)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                              >
                                <Bell size={11} />
                                Send Reminder
                              </button>
                              <button
                                onClick={() => {
                                  const url = `https://pay.servlo.com.au/inv/${inv.id.slice(0, 8)}`;
                                  navigator.clipboard.writeText(url).catch(() => {});
                                  show(`Link copied: ${url}`);
                                }}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                                style={{ background: "#052e16", color: "#22C55E", border: "1px solid #22C55E33" }}
                              >
                                <Link2 size={11} />
                                Create Payment Link
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Payment Links tab ── */}
        {tab === "links" && (
          <div className="p-5 space-y-6">
            {/* Feature preview */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#052e16", border: "1px solid #22C55E33" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>
                Generate shareable payment links for any invoice or custom amount
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Share via SMS, email, or WhatsApp. Customers pay instantly without creating an account.
              </p>
            </div>

            {/* Generator form */}
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Generate Link
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Amount (AUD)
                  </label>
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <span className="px-2 py-2 text-sm" style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={linkAmount}
                      onChange={(e) => setLinkAmount(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm bg-transparent outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plumbing service"
                    value={linkDesc}
                    onChange={(e) => setLinkDesc(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Expiry
                  </label>
                  <select
                    value={linkExpiry}
                    onChange={(e) => setLinkExpiry(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              </div>
              <button
                onClick={generateLink}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{ background: "#22C55E", color: "#052e16" }}
              >
                <Copy size={14} />
                Generate &amp; Copy Link
              </button>
            </div>

            {/* Generated links */}
            {links.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Recent Links
                </h3>
                {links.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 gap-3"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono truncate" style={{ color: "#22C55E" }}>
                        {l.url}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {fmt(l.amount)} · {l.description} · expires in {l.expiryDays}d · created {l.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#052e16", color: "#22C55E", border: "1px solid #22C55E33" }}>
                        Active
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(l.url).catch(() => {});
                          show("Link copied!");
                        }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
                        style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        <Copy size={11} />
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings tab ── */}
        {tab === "settings" && (
          <div className="p-5 space-y-6">
            {/* Stripe card */}
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold"
                    style={{ background: "#052e16", color: "#22C55E" }}
                  >
                    S
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Stripe</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Payment gateway</p>
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "#052e16", color: "#22C55E", border: "1px solid #22C55E33" }}>
                  Connected
                </span>
              </div>
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                Processing fee: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>2.2% + $0.30</span> per transaction (AUD)
              </div>
            </div>

            {/* Disabled settings */}
            <div className="space-y-3">
              <div
                className="rounded-xl p-5 space-y-2 opacity-60"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Payout schedule</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>How often Stripe pays out to your bank</p>
                  </div>
                  <select
                    disabled
                    className="rounded-lg px-3 py-1.5 text-xs cursor-not-allowed"
                    style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              <div
                className="rounded-xl p-5 opacity-60"
                style={{ border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Statement descriptor</p>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Appears on your customer&apos;s bank statement</p>
                <input
                  disabled
                  defaultValue="SERVLO"
                  className="w-full rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                  style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}
                />
              </div>

              <div
                className="rounded-xl p-5 opacity-60"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Enable saved cards</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Let returning customers pay with one tap</p>
                  </div>
                  <div
                    className="h-6 w-11 rounded-full cursor-not-allowed"
                    style={{ background: "var(--border)" }}
                  />
                </div>
              </div>
            </div>

            {/* Coming soon banner */}
            <div
              className="rounded-xl px-5 py-4 flex items-start gap-3"
              style={{ background: "#052e16", border: "1px solid #22C55E33" }}
            >
              <span className="mt-0.5 text-base">🚀</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>Coming Q2 2026</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Full payout management, statement descriptor customisation, and saved cards will be available at general availability launch.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} />

      {/* Add Transaction Modal */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>Record Transaction</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Amount (AUD) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={addTxAmount}
                  onChange={(e) => setAddTxAmount(e.target.value)}
                  placeholder="e.g. 350.00"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Payment Method</label>
                <select
                  value={addTxMethod}
                  onChange={(e) => setAddTxMethod(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Description (optional)</label>
                <input
                  type="text"
                  value={addTxDesc}
                  onChange={(e) => setAddTxDesc(e.target.value)}
                  placeholder="e.g. Invoice #INV-0012 payment"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowAddTx(false); setAddTxAmount(""); setAddTxDesc(""); setAddTxMethod("card"); }}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTransaction}
                disabled={addTxSaving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#22C55E" }}
              >
                {addTxSaving ? "Saving…" : "Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
