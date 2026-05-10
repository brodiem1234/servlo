"use client";

import { useState, useMemo } from "react";

type Expense = {
  id: string;
  description: string | null;
  amount: number | null;
  category: string | null;
  status: string | null;
  receipt_url: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  notes: string | null;
  employee_id: string | null;
  job_id: string | null;
  created_at: string;
};

type Employee = {
  id: string;
  full_name: string | null;
};

type Props = {
  expenses: Expense[];
  employees: Employee[];
};

const CATEGORIES = [
  "Fuel",
  "Tools & Equipment",
  "Materials",
  "Vehicle Maintenance",
  "Parking & Tolls",
  "Meals & Entertainment",
  "Software & Subscriptions",
  "Training & Licensing",
  "PPE & Safety",
  "Office Supplies",
  "Accommodation",
  "Other",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Fuel": "⛽",
  "Tools & Equipment": "🔧",
  "Materials": "📦",
  "Vehicle Maintenance": "🚗",
  "Parking & Tolls": "🅿️",
  "Meals & Entertainment": "🍽️",
  "Software & Subscriptions": "💻",
  "Training & Licensing": "📚",
  "PPE & Safety": "🦺",
  "Office Supplies": "📎",
  "Accommodation": "🏨",
  "Other": "📋",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  paid:     { label: "Paid",     className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
};

function formatCurrency(n: number | null) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n ?? 0);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

const BLANK_FORM = {
  description: "",
  amount: "",
  category: "Other",
  notes: "",
  employee_id: "",
  submitted_at: new Date().toISOString().slice(0, 10),
};

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-2xl ${ok ? "bg-emerald-600" : "bg-red-600"}`}
    >
      {msg}
    </div>
  );
}

export function ExpensesManager({ expenses: initialExpenses, employees }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (search && !((e.description ?? "").toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [expenses, statusFilter, categoryFilter, search]);

  const totalPending = expenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const totalApproved = expenses
    .filter((e) => e.status === "approved" || e.status === "paid")
    .reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const totalThisMonth = expenses
    .filter((e) => {
      const created = e.submitted_at ?? e.created_at;
      const thisMonth = new Date().toISOString().slice(0, 7);
      return created && created.slice(0, 7) === thisMonth;
    })
    .reduce((s, e) => s + Number(e.amount ?? 0), 0);

  function openCreate() {
    setForm(BLANK_FORM);
    setCreating(true);
    setEditingId(null);
  }

  function openEdit(e: Expense) {
    setForm({
      description: e.description ?? "",
      amount: String(e.amount ?? ""),
      category: e.category ?? "Other",
      notes: e.notes ?? "",
      employee_id: e.employee_id ?? "",
      submitted_at: (e.submitted_at ?? e.created_at).slice(0, 10),
    });
    setEditingId(e.id);
    setCreating(false);
  }

  async function handleSave() {
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    const payload = {
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      notes: form.notes.trim() || null,
      employee_id: form.employee_id || null,
      submitted_at: form.submitted_at || new Date().toISOString().slice(0, 10),
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/expenses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        const updated = await res.json();
        setExpenses((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...payload, ...updated.expense } : e)));
        showToast("Expense updated", true);
        setEditingId(null);
      } else {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        const created = await res.json();
        const newExpense: Expense = {
          id: created.expense?.id ?? crypto.randomUUID(),
          ...payload,
          status: "pending",
          receipt_url: null,
          approved_at: null,
          job_id: null,
          created_at: new Date().toISOString(),
          submitted_at: payload.submitted_at,
        };
        setExpenses((prev) => [newExpense, ...prev]);
        showToast("Expense added", true);
        setCreating(false);
      }
      setForm(BLANK_FORM);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const prev = expenses.find((e) => e.id === id);
    setExpenses((p) => p.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      showToast(`Marked as ${newStatus}`, true);
    } catch {
      setExpenses((p) => p.map((e) => (e.id === id ? { ...e, status: prev?.status ?? "pending" } : e)));
      showToast("Failed to update status", false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense claim?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExpenses((p) => p.filter((e) => e.id !== id));
      showToast("Expense deleted", true);
    } catch {
      showToast("Failed to delete", false);
    } finally {
      setDeletingId(null);
    }
  }

  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));

  const usedCategories = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Expense Claims</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Track and approve team expense submissions</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/30 dark:bg-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Pending Approval</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
            {expenses.filter((e) => e.status === "pending").length} claim{expenses.filter((e) => e.status === "pending").length !== 1 ? "s" : ""}
          </p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700/30 dark:bg-emerald-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Approved / Paid</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalApproved)}</p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
            {expenses.filter((e) => e.status === "approved" || e.status === "paid").length} claim{expenses.filter((e) => e.status === "approved" || e.status === "paid").length !== 1 ? "s" : ""}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">This Month</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalThisMonth)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">All submitted</p>
        </article>
      </div>

      {/* Add / Edit form */}
      {(creating || editingId) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">
            {editingId ? "Edit Expense" : "New Expense Claim"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Description *</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Fuel for site visit"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Amount (AUD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pl-7 pr-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Date</label>
              <input
                type="date"
                value={form.submitted_at}
                onChange={(e) => setForm((p) => ({ ...p, submitted_at: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>
            {employees.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Submitted by</label>
                <select
                  value={form.employee_id}
                  onChange={(e) => setForm((p) => ({ ...p, employee_id: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                >
                  <option value="">Owner / Self</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Notes (optional)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Additional details or receipt reference…"
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.description.trim() || !form.amount}
              className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add expense"}
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditingId(null); setForm(BLANK_FORM); }}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expenses…"
          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 text-xs text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 text-xs text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="all">All categories</option>
          {usedCategories.map((c) => (
            <option key={c} value={c!}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl mb-2">🧾</div>
            <p className="text-[var(--text-secondary)] font-medium text-sm">
              {expenses.length === 0 ? "No expense claims yet" : "No claims match your filters"}
            </p>
            {expenses.length === 0 && (
              <button type="button" onClick={openCreate} className="mt-3 text-sm font-semibold text-[var(--accent-color)] hover:underline">
                Add your first expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Submitted by</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => {
                  const badge = STATUS_BADGE[expense.status ?? "pending"] ?? STATUS_BADGE.pending;
                  const catIcon = CATEGORY_ICONS[expense.category ?? "Other"] ?? "📋";
                  const empName = expense.employee_id ? (employeeMap[expense.employee_id] ?? "—") : "Owner";
                  return (
                    <tr
                      key={expense.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                        {formatDate(expense.submitted_at ?? expense.created_at)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)] max-w-xs">
                        <p className="font-medium truncate">{expense.description ?? "—"}</p>
                        {expense.notes && (
                          <p className="text-xs text-[var(--text-muted)] truncate">{expense.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden>{catIcon}</span>
                          {expense.category ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                        {empName}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)] font-mono whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={expense.status ?? "pending"}
                          onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold border-0 cursor-pointer focus:outline-none ${badge.className}`}
                          aria-label={`Status for ${expense.description}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="paid">Paid</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {expense.receipt_url && (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-color)]"
                              title="View receipt"
                            >
                              🧾
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(expense)}
                            className="rounded p-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-color)]"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            className="rounded p-1 text-xs text-[var(--text-muted)] hover:text-red-500 disabled:opacity-50"
                            title="Delete"
                          >
                            🗑️
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
        <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">{filtered.length} of {expenses.length} expense{expenses.length !== 1 ? "s" : ""}</p>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            Filtered total: {formatCurrency(filtered.reduce((s, e) => s + Number(e.amount ?? 0), 0))}
          </p>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
