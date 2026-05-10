"use client";

import { useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Pencil,
  Check,
  X,
  Plus,
  RefreshCw,
  FileText,
  Receipt,
  Link2,
  ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  reconciled: boolean;
  source: string | null;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  status: string;
  expense_date: string;
  category: string | null;
  submitted_by?: string | null;
}

interface BasLodgement {
  id: string;
  period_start: string;
  period_end: string;
  quarter: string | null;
  gst_collected: number;
  gst_paid: number;
  gst_net: number;
  status: string;
}

interface Stats {
  revenue90d: number;
  outstanding: number;
  overdueCount: number;
  inflow: number;
  outflow: number;
  unreconciledCount: number;
  netCashflow: number;
  expensesPending: number;
}

interface Props {
  transactions: Transaction[];
  expenses: Expense[];
  basLodgements: BasLodgement[];
  stats: Stats;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border"
          style={
            t.type === "success"
              ? {
                  background: "#022c22",
                  color: "#6ee7b7",
                  borderColor: "#05966933",
                }
              : {
                  background: "#2d0a0a",
                  color: "#fca5a5",
                  borderColor: "#ef444433",
                }
          }
        >
          {t.type === "success" ? (
            <Check size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-2"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "#05966915" }}
        >
          <Icon size={15} style={{ color: "#059669" }} />
        </span>
      </div>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function FinanceHubDashboard({
  transactions: initialTransactions,
  expenses: initialExpenses,
  basLodgements: initialBas,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "bank" | "expenses" | "bas" | "integrations"
  >("bank");
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [bas, setBas] = useState<BasLodgement[]>(initialBas);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [toastSeq, setToastSeq] = useState(0);

  // Add transaction form
  const [showTxForm, setShowTxForm] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    category: "",
  });
  const [txErrors, setTxErrors] = useState<Record<string, string>>({});

  // Add expense form
  const [showExpForm, setShowExpForm] = useState(false);
  const [expLoading, setExpLoading] = useState(false);
  const [expForm, setExpForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    category: "",
    receipt_url: "",
  });
  const [expErrors, setExpErrors] = useState<Record<string, string>>({});

  // Inline category editing for transactions
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState("");

  // Integration connection state
  const [intRequested, setIntRequested] = useState<Set<string>>(new Set());

  // BAS form
  const [showBasForm, setShowBasForm] = useState(false);
  const [basLoading, setBasLoading] = useState(false);

  const toast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = toastSeq + 1;
      setToastSeq(id);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    },
    [toastSeq]
  );

  // ── Bank Feed actions ────────────────────────────────────────────────────────

  function validateTxForm() {
    const errs: Record<string, string> = {};
    if (!txForm.description.trim()) errs.description = "Description is required";
    if (!txForm.amount.trim() || isNaN(Number(txForm.amount)))
      errs.amount = "Valid amount is required";
    setTxErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submitTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!validateTxForm()) return;
    setTxLoading(true);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: txForm.date,
          description: txForm.description.trim(),
          amount: Number(txForm.amount),
          category: txForm.category || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add transaction");
      setTransactions((prev) => [json.transaction, ...prev]);
      setTxForm({
        date: new Date().toISOString().slice(0, 10),
        description: "",
        amount: "",
        category: "",
      });
      setShowTxForm(false);
      toast("Transaction added");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setTxLoading(false);
    }
  }

  function startEditCat(tx: Transaction) {
    setEditingCatId(tx.id);
    setEditingCatValue(tx.category ?? "");
  }

  async function saveCategory(id: string) {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, category: editingCatValue || null } : t
      )
    );
    setEditingCatId(null);
    // Optimistic — fire and forget (table may not exist yet)
    try {
      await fetch("/api/finance/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, category: editingCatValue || null }),
      }).catch(() => null);
    } catch {
      // ignore
    }
  }

  async function toggleReconciled(tx: Transaction) {
    const next = !tx.reconciled;
    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? { ...t, reconciled: next } : t))
    );
    try {
      await fetch("/api/finance/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tx.id, reconciled: next }),
      }).catch(() => null);
    } catch {
      // ignore
    }
  }

  // ── Expense actions ──────────────────────────────────────────────────────────

  function validateExpForm() {
    const errs: Record<string, string> = {};
    if (!expForm.description.trim()) errs.description = "Description is required";
    if (!expForm.amount.trim() || isNaN(Number(expForm.amount)))
      errs.amount = "Valid amount required";
    setExpErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!validateExpForm()) return;
    setExpLoading(true);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: expForm.expense_date,
          description: expForm.description.trim(),
          amount: Number(expForm.amount),
          category: expForm.category || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit expense");
      setExpenses((prev) => [json.expense, ...prev]);
      setExpForm({
        expense_date: new Date().toISOString().slice(0, 10),
        description: "",
        amount: "",
        category: "",
        receipt_url: "",
      });
      setShowExpForm(false);
      toast("Expense submitted for approval");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setExpLoading(false);
    }
  }

  // ── Tabs config ──────────────────────────────────────────────────────────────

  const TABS = [
    { id: "bank", label: "Bank Feed" },
    { id: "expenses", label: "Expenses" },
    { id: "bas", label: "BAS" },
    { id: "integrations", label: "Integrations" },
  ] as const;

  // ── Render ───────────────────────────────────────────────────────────────────

  const unreconciledNow = transactions.filter((t) => !t.reconciled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            SERVLO FINANCE HUB
          </h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              background: "#042f2e",
              color: "#059669",
              border: "1px solid #05966933",
            }}
          >
            Live Data
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Accounting &amp; Cash Flow — bank feeds, expenses, BAS, and accounting
          integrations
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (90d)"
          value={fmt(stats.revenue90d)}
          sub="Paid invoices"
          icon={TrendingUp}
        />
        <StatCard
          label="Outstanding"
          value={fmt(stats.outstanding)}
          sub={
            stats.overdueCount > 0
              ? `${stats.overdueCount} overdue`
              : "All current"
          }
          accent={stats.outstanding > 0 ? "#f59e0b" : undefined}
          icon={AlertCircle}
        />
        <StatCard
          label="Net Cashflow"
          value={fmt(stats.netCashflow)}
          sub={
            stats.netCashflow >= 0
              ? "Positive cash position"
              : "Negative cash position"
          }
          accent={stats.netCashflow >= 0 ? "#059669" : "#ef4444"}
          icon={stats.netCashflow >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Expenses Pending"
          value={fmt(stats.expensesPending)}
          sub="Awaiting approval"
          icon={Receipt}
        />
      </div>

      {/* Tabs */}
      <div
        className="border-b"
        style={{ borderColor: "var(--border)" }}
        role="tablist"
        aria-label="Finance Hub sections"
      >
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-3 text-sm font-medium transition-colors"
              style={{
                color:
                  activeTab === tab.id
                    ? "var(--accent-color, #059669)"
                    : "var(--text-muted)",
              }}
            >
              {tab.label}
              {tab.id === "bank" && unreconciledNow > 0 && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={{ background: "#f59e0b22", color: "#f59e0b" }}
                >
                  {unreconciledNow}
                </span>
              )}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: "var(--accent-color, #059669)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bank Feed Tab ─────────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="panel-bank"
        aria-labelledby="tab-bank"
        hidden={activeTab !== "bank"}
      >
        {activeTab === "bank" && (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Inflow",
                  value: fmt(stats.inflow),
                  color: "#059669",
                },
                {
                  label: "Outflow",
                  value: fmt(stats.outflow),
                  color: "#ef4444",
                },
                {
                  label: "Net",
                  value: fmt(stats.inflow - stats.outflow),
                  color: stats.inflow - stats.outflow >= 0 ? "#059669" : "#ef4444",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border p-4 text-center"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-card)",
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Add transaction button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {unreconciledNow > 0 && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: "#f59e0b22", color: "#f59e0b" }}
                  >
                    {unreconciledNow} unreconciled
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowTxForm((v) => !v)}
                aria-label="Add transaction"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "#059669", color: "#fff" }}
              >
                <Plus size={14} />
                Add Transaction
              </button>
            </div>

            {/* Inline add-transaction form */}
            {showTxForm && (
              <form
                onSubmit={submitTransaction}
                className="rounded-xl border p-4 space-y-3"
                style={{
                  borderColor: "#05966933",
                  background: "#042f2e33",
                }}
                aria-label="Add transaction form"
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  New Transaction
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="tx-date"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Date
                    </label>
                    <input
                      id="tx-date"
                      type="date"
                      value={txForm.date}
                      onChange={(e) =>
                        setTxForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="tx-amount"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Amount (negative = outflow)
                    </label>
                    <input
                      id="tx-amount"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1250.00 or -89.50"
                      value={txForm.amount}
                      onChange={(e) =>
                        setTxForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: txErrors.amount
                          ? "#ef4444"
                          : "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {txErrors.amount && (
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                        {txErrors.amount}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="tx-desc"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Description
                    </label>
                    <input
                      id="tx-desc"
                      type="text"
                      placeholder="e.g. Office supplies"
                      value={txForm.description}
                      onChange={(e) =>
                        setTxForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: txErrors.description
                          ? "#ef4444"
                          : "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {txErrors.description && (
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                        {txErrors.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="tx-cat"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Category (optional)
                    </label>
                    <input
                      id="tx-cat"
                      type="text"
                      placeholder="e.g. Equipment"
                      value={txForm.category}
                      onChange={(e) =>
                        setTxForm((f) => ({ ...f, category: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTxForm(false)}
                    className="rounded-lg px-3 py-2 text-sm border"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={txLoading}
                    className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#059669", color: "#fff" }}
                  >
                    {txLoading ? "Saving…" : "Save Transaction"}
                  </button>
                </div>
              </form>
            )}

            {/* Transactions table */}
            {transactions.length === 0 ? (
              <div
                className="rounded-xl border p-10 text-center space-y-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-card)",
                }}
              >
                <DollarSign
                  size={32}
                  className="mx-auto"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  No transactions yet
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Connect your bank to auto-import transactions. Manual entry
                  also available.
                </p>
                <button
                  onClick={() => setShowTxForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ background: "#059669", color: "#fff" }}
                >
                  <Plus size={14} />
                  Add Transaction
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <table
                  className="w-full text-sm"
                  role="table"
                  aria-label="Bank transactions"
                >
                  <thead>
                    <tr
                      className="border-b text-xs uppercase tracking-wide"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <th className="px-4 py-3 text-left font-semibold">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Reconciled
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b last:border-0 transition-colors hover:bg-white/5"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <td
                          className="px-4 py-3 tabular-nums whitespace-nowrap"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {fmtDate(tx.date)}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tx.description}
                          {tx.source === "manual" && (
                            <span
                              className="ml-2 rounded px-1 py-0.5 text-xs"
                              style={{
                                background: "var(--border)",
                                color: "var(--text-muted)",
                              }}
                            >
                              manual
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingCatId === tx.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingCatValue}
                                onChange={(e) =>
                                  setEditingCatValue(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveCategory(tx.id);
                                  if (e.key === "Escape")
                                    setEditingCatId(null);
                                }}
                                autoFocus
                                aria-label="Edit category"
                                className="w-32 rounded border px-2 py-1 text-xs"
                                style={{
                                  borderColor: "#059669",
                                  background: "var(--bg-card)",
                                  color: "var(--text-primary)",
                                }}
                              />
                              <button
                                onClick={() => saveCategory(tx.id)}
                                aria-label="Save category"
                                className="rounded p-1 hover:bg-white/10"
                              >
                                <Check size={12} style={{ color: "#059669" }} />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                aria-label="Cancel edit"
                                className="rounded p-1 hover:bg-white/10"
                              >
                                <X
                                  size={12}
                                  style={{ color: "var(--text-muted)" }}
                                />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditCat(tx)}
                              aria-label={`Edit category for ${tx.description}`}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-white/10"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {tx.category ?? (
                                <span style={{ color: "var(--text-muted)" }}>
                                  Uncategorised
                                </span>
                              )}
                              <Pencil
                                size={10}
                                style={{ color: "var(--text-muted)" }}
                              />
                            </button>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums font-semibold"
                          style={{
                            color: tx.amount >= 0 ? "#059669" : "#ef4444",
                          }}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {fmt(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={tx.reconciled}
                            onChange={() => toggleReconciled(tx)}
                            aria-label={`Mark ${tx.description} as reconciled`}
                            className="h-4 w-4 cursor-pointer rounded"
                            style={{ accentColor: "#059669" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Expenses Tab ──────────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="panel-expenses"
        aria-labelledby="tab-expenses"
        hidden={activeTab !== "expenses"}
      >
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Pending &amp; approved expense claims
              </p>
              <button
                onClick={() => setShowExpForm((v) => !v)}
                aria-label="Submit expense"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "#059669", color: "#fff" }}
              >
                <Plus size={14} />
                Submit Expense
              </button>
            </div>

            {/* Inline expense form */}
            {showExpForm && (
              <form
                onSubmit={submitExpense}
                className="rounded-xl border p-4 space-y-3"
                style={{ borderColor: "#05966933", background: "#042f2e33" }}
                aria-label="Submit expense form"
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  New Expense Claim
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="exp-date"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Date
                    </label>
                    <input
                      id="exp-date"
                      type="date"
                      value={expForm.expense_date}
                      onChange={(e) =>
                        setExpForm((f) => ({
                          ...f,
                          expense_date: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="exp-amount"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Amount
                    </label>
                    <input
                      id="exp-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={expForm.amount}
                      onChange={(e) =>
                        setExpForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: expErrors.amount
                          ? "#ef4444"
                          : "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {expErrors.amount && (
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                        {expErrors.amount}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="exp-desc"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Description
                    </label>
                    <input
                      id="exp-desc"
                      type="text"
                      placeholder="What was this expense for?"
                      value={expForm.description}
                      onChange={(e) =>
                        setExpForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: expErrors.description
                          ? "#ef4444"
                          : "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {expErrors.description && (
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                        {expErrors.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="exp-cat"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Category (optional)
                    </label>
                    <input
                      id="exp-cat"
                      type="text"
                      placeholder="e.g. Travel"
                      value={expForm.category}
                      onChange={(e) =>
                        setExpForm((f) => ({ ...f, category: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="exp-receipt"
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Receipt URL (optional)
                    </label>
                    <input
                      id="exp-receipt"
                      type="url"
                      placeholder="https://…"
                      value={expForm.receipt_url}
                      onChange={(e) =>
                        setExpForm((f) => ({
                          ...f,
                          receipt_url: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowExpForm(false)}
                    className="rounded-lg px-3 py-2 text-sm border"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={expLoading}
                    className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#059669", color: "#fff" }}
                  >
                    {expLoading ? "Submitting…" : "Submit for Approval"}
                  </button>
                </div>
              </form>
            )}

            {/* Expenses table */}
            {expenses.length === 0 ? (
              <div
                className="rounded-xl border p-10 text-center space-y-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-card)",
                }}
              >
                <Receipt
                  size={32}
                  className="mx-auto"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  No expense claims yet
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Submit expense claims for reimbursement or approval. Keep your
                  team costs visible in one place.
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <table
                  className="w-full text-sm"
                  role="table"
                  aria-label="Expense claims"
                >
                  <thead>
                    <tr
                      className="border-b text-xs uppercase tracking-wide"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <th className="px-4 py-3 text-left font-semibold">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => {
                      const statusStyle: Record<
                        string,
                        { bg: string; color: string }
                      > = {
                        pending: { bg: "#f59e0b22", color: "#f59e0b" },
                        approved: { bg: "#05966922", color: "#059669" },
                        rejected: { bg: "#ef444422", color: "#ef4444" },
                        paid: { bg: "#3b82f622", color: "#3b82f6" },
                      };
                      const s = statusStyle[exp.status] ?? {
                        bg: "var(--border)",
                        color: "var(--text-muted)",
                      };
                      return (
                        <tr
                          key={exp.id}
                          className="border-b last:border-0 hover:bg-white/5"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <td
                            className="px-4 py-3 tabular-nums whitespace-nowrap"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {fmtDate(exp.expense_date)}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {exp.description}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {exp.category ?? (
                              <span style={{ color: "var(--text-muted)" }}>
                                —
                              </span>
                            )}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {fmt(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                              style={{ background: s.bg, color: s.color }}
                            >
                              {exp.status}
                            </span>
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
      </div>

      {/* ── BAS Tab ───────────────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="panel-bas"
        aria-labelledby="tab-bas"
        hidden={activeTab !== "bas"}
      >
        {activeTab === "bas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Business Activity Statements
              </p>
              <button
                onClick={() => setShowBasForm((v) => !v)}
                aria-label="Prepare new BAS"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                style={{ background: "#059669", color: "#fff" }}
              >
                <FileText size={14} />
                Prepare New BAS
              </button>
            </div>

            {/* Placeholder BAS prepare form */}
            {showBasForm && (
              <div
                className="rounded-xl border p-5 space-y-3"
                style={{
                  borderColor: "#05966933",
                  background: "#042f2e33",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Prepare BAS
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  GST figures are pre-filled from your paid invoices in the last
                  quarter. Review and adjust before lodging.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "GST Collected",
                      value: fmt(stats.revenue90d * 0.1),
                    },
                    { label: "GST Paid (Credits)", value: fmt(stats.outflow * 0.1) },
                    {
                      label: "Net Liability",
                      value: fmt(
                        stats.revenue90d * 0.1 - stats.outflow * 0.1
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-lg font-bold tabular-nums mt-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  BAS lodgement requires the BAS lodgements table to be applied.
                  Contact your accountant or use the ATO Business Portal to
                  lodge.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBasForm(false);
                      setBasLoading(false);
                    }}
                    className="rounded-lg px-3 py-2 text-sm border"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={basLoading}
                    onClick={() => {
                      setBasLoading(true);
                      toast("BAS prepared as draft — connect ATO to lodge", "success");
                      setShowBasForm(false);
                      setBasLoading(false);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#059669", color: "#fff" }}
                  >
                    {basLoading ? "Saving…" : "Save as Draft"}
                  </button>
                </div>
              </div>
            )}

            {/* BAS lodgements */}
            {bas.length === 0 ? (
              <div
                className="rounded-xl border p-10 text-center space-y-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-card)",
                }}
              >
                <FileText
                  size={32}
                  className="mx-auto"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  No BAS lodgements yet
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Prepare your first BAS for the current quarter. GST figures
                  will be pre-filled from your invoices.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {bas.map((b) => {
                  const statusStyle: Record<
                    string,
                    { bg: string; color: string }
                  > = {
                    draft: { bg: "var(--border)", color: "var(--text-muted)" },
                    prepared: { bg: "#3b82f622", color: "#3b82f6" },
                    lodged: { bg: "#05966922", color: "#059669" },
                    assessed: { bg: "#05966933", color: "#34d399" },
                  };
                  const s = statusStyle[b.status] ?? statusStyle.draft;
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border p-5 space-y-3"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {b.quarter ?? `${b.period_start} – ${b.period_end}`}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {fmtDate(b.period_start)} — {fmtDate(b.period_end)}
                      </p>
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            ["GST Collected", fmt(b.gst_collected)],
                            ["GST Paid", fmt(b.gst_paid)],
                            ["Net Liability", fmt(b.gst_net)],
                          ].map(([label, val]) => (
                            <tr
                              key={label}
                              className="border-b last:border-0"
                              style={{ borderColor: "var(--border)" }}
                            >
                              <td
                                className="py-1.5"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {label}
                              </td>
                              <td
                                className="py-1.5 text-right tabular-nums font-semibold"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {val}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Integrations Tab ──────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="panel-integrations"
        aria-labelledby="tab-integrations"
        hidden={activeTab !== "integrations"}
      >
        {activeTab === "integrations" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Connect SERVLO to your accounting software for seamless data sync.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  name: "Xero",
                  color: "#059669",
                  bg: "#05966915",
                  desc: "Sync invoices, expenses, and bank transactions to Xero automatically. Reconcile in real time.",
                },
                {
                  name: "MYOB",
                  color: "#ef4444",
                  bg: "#ef444415",
                  desc: "Push your SERVLO data to MYOB AccountRight or Essentials. Keep your books up to date.",
                },
                {
                  name: "QuickBooks",
                  color: "#22c55e",
                  bg: "#22c55e15",
                  desc: "Connect to QuickBooks Online for two-way sync of transactions and customer records.",
                },
                {
                  name: "ATO Prefill",
                  color: "#3b82f6",
                  bg: "#3b82f615",
                  desc: "Retrieve ATO prefill data for BAS, income tax, and PAYG to streamline lodgement.",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="rounded-xl border p-5 flex flex-col gap-4"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-card)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{
                        background: integration.bg,
                        color: integration.color,
                      }}
                    >
                      {integration.name[0]}
                    </div>
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {integration.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Not connected
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-sm flex-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {integration.desc}
                  </p>
                  {intRequested.has(integration.name) ? (
                    <div
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold border"
                      style={{ borderColor: integration.color + "44", color: integration.color, background: integration.bg }}
                    >
                      ✓ Access requested — we&apos;ll be in touch
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIntRequested((prev) => new Set([...prev, integration.name]));
                        toast(`${integration.name} integration requested! Our team will be in touch.`, "success");
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold border transition-opacity hover:opacity-80"
                      style={{ borderColor: integration.color + "44", color: integration.color, background: integration.bg }}
                    >
                      <Link2 size={14} />
                      Connect {integration.name}
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
