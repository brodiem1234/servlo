"use client";

import { useState, useEffect } from "react";

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  notes: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  receipt_url: string | null;
};

const CATEGORIES = [
  "Fuel", "Tools", "Materials", "Parking", "Food & Meals", "Accommodation",
  "Phone", "Uniform", "Safety Equipment", "Other",
];

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  paid:     "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

const CATEGORY_ICONS: Record<string, string> = {
  Fuel: "⛽", Tools: "🔧", Materials: "📦", Parking: "🅿️",
  "Food & Meals": "🍔", Accommodation: "🏨", Phone: "📱",
  Uniform: "👕", "Safety Equipment": "🦺", Other: "📋",
};

export default function EmployeeExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Other",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/employee/expenses")
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount) || 0,
          category: form.category,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setExpenses((prev) => [data.expense, ...prev]);
      setForm({ description: "", amount: "", category: "Other", notes: "" });
      setShowForm(false);
      setToast({ type: "success", message: "Expense submitted for approval" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const pendingTotal = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const approvedTotal = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Expenses</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Submit work-related expenses for reimbursement</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--accent-color)" }}
        >
          {showForm ? "Cancel" : "+ Submit Expense"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pending approval</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>${pendingTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Approved</p>
          <p className="text-xl font-bold mt-1 text-green-600">${approvedTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Submission form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>New Expense</h2>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Description *</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Fuel for site visit"
              className="h-10 w-full rounded-lg border px-3 text-sm"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border px-3 text-sm"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="h-10 w-full rounded-lg border px-3 text-sm"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_ICONS[c] ?? "📋"} {c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any extra details…"
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.description.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent-color)" }}
          >
            {submitting ? "Submitting…" : "Submit Expense"}
          </button>
        </form>
      )}

      {/* Expense list */}
      {loading ? (
        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</div>
      ) : expenses.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-3xl mb-2">🧾</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>No expenses yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Submit your first expense above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <span className="text-xl">{CATEGORY_ICONS[e.category] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{e.description}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {e.category}
                  {e.submitted_at ? ` · ${new Date(e.submitted_at).toLocaleDateString("en-AU")}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>${Number(e.amount).toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
