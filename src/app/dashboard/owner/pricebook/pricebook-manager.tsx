"use client";

import { useState, useRef, useCallback } from "react";
import { Package, Plus, Search, Tag, Edit2, Trash2, Wrench, ShoppingCart, X, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { PricebookImport } from "./pricebook-import";

type PricebookItem = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit_price: number;
  cost_price: number | null;
  unit: string;
  category: string | null;
  is_service: boolean;
  quantity_on_hand: number | null;
  reorder_threshold: number | null;
  is_active: boolean;
  created_at: string;
};

type Props = {
  initialItems: PricebookItem[];
  categories: string[];
};

const UNITS = ["each", "m", "m²", "m³", "kg", "L", "hr", "day", "set", "roll", "box", "pack"];

const emptyForm = {
  name: "",
  description: "",
  sku: "",
  unit_price: "",
  cost_price: "",
  unit: "each",
  category: "",
  is_service: false,
  quantity_on_hand: "",
  reorder_threshold: "5",
  is_active: true,
};

type ToastState = { type: "success" | "error"; message: string } | null;

export default function PricebookManager({ initialItems, categories }: Props) {
  const [items, setItems] = useState<PricebookItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.unit_price || isNaN(Number(form.unit_price)) || Number(form.unit_price) < 0) {
      errors.unit_price = "Valid price required";
    }
    return errors;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const openEdit = (item: PricebookItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      sku: item.sku ?? "",
      unit_price: String(item.unit_price),
      cost_price: item.cost_price != null ? String(item.cost_price) : "",
      unit: item.unit ?? "each",
      category: item.category ?? "",
      is_service: item.is_service,
      quantity_on_hand: item.quantity_on_hand != null ? String(item.quantity_on_hand) : "",
      reorder_threshold: item.reorder_threshold != null ? String(item.reorder_threshold) : "5",
      is_active: item.is_active,
    });
    setFormErrors({});
    setShowForm(true);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        sku: form.sku || null,
        unit_price: Number(form.unit_price),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        unit: form.unit,
        category: form.category || null,
        is_service: form.is_service,
        quantity_on_hand: form.quantity_on_hand !== "" ? Number(form.quantity_on_hand) : null,
        reorder_threshold: form.reorder_threshold !== "" ? Number(form.reorder_threshold) : 5,
        is_active: form.is_active,
      };
      if (editingId) {
        const res = await fetch(`/api/pricebook/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
        const { item: updated } = await res.json();
        setItems(prev => prev.map(i => i.id === editingId ? updated : i));
        showToast("success", "Item updated");
      } else {
        const res = await fetch("/api/pricebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
        const { item: created } = await res.json();
        setItems(prev => [created, ...prev]);
        showToast("success", "Item added to pricebook");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your pricebook?`)) return;
    setDeleting(id);
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      const res = await fetch(`/api/pricebook/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("success", "Item removed");
    } catch {
      setItems(initialItems);
      showToast("error", "Could not remove item");
    } finally {
      setDeleting(null);
    }
  }, [initialItems]);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.sku ?? "").toLowerCase().includes(q) || (item.category ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "all" || item.category === catFilter;
    const matchType = typeFilter === "all" || (typeFilter === "service" ? item.is_service : !item.is_service);
    const matchLow = !showLowStockOnly || (!item.is_service && item.quantity_on_hand != null && item.reorder_threshold != null && item.quantity_on_hand <= item.reorder_threshold);
    return matchSearch && matchCat && matchType && matchLow;
  });

  const lowStockCount = items.filter(i => !i.is_service && i.quantity_on_hand != null && i.reorder_threshold != null && i.quantity_on_hand <= i.reorder_threshold).length;
  const allCategories = [...new Set(items.map(i => i.category).filter(Boolean))].sort() as string[];

  const getMargin = (item: PricebookItem) => {
    if (!item.cost_price || item.cost_price === 0 || item.unit_price === 0) return null;
    return Math.round(((item.unit_price - item.cost_price) / item.unit_price) * 100);
  };

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

  return (
    <div className="space-y-6">
      {toast && (
        <div role="alert" className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <Check size={16} aria-hidden /> : <AlertCircle size={16} aria-hidden />}
          {toast.message}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pricebook</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {items.length} items · {allCategories.length} categories
            {lowStockCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-500 font-medium">
                <AlertTriangle size={12} aria-hidden />
                {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PricebookImport />
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2" aria-label="Add pricebook item">
            <Plus size={16} aria-hidden />
            Add Item
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-400">{lowStockCount} item{lowStockCount > 1 ? "s" : ""} running low on stock</p>
              <p className="text-xs text-amber-500/80">Stock is at or below reorder threshold</p>
            </div>
          </div>
          <button onClick={() => setShowLowStockOnly(v => !v)} className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${showLowStockOnly ? "bg-amber-500 text-black" : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"}`}>
            {showLowStockOnly ? "Show all items" : "Show low stock only"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" aria-hidden />
          <input type="search" placeholder="Search items, SKU, category…" value={search} onChange={e => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]" aria-label="Search pricebook" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]" aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="product">Products</option>
          <option value="service">Services</option>
        </select>
        {allCategories.length > 0 && (
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]" aria-label="Filter by category">
            <option value="all">All categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] py-16 text-center">
          <Package size={36} className="mx-auto mb-3 text-[var(--text-muted)]" aria-hidden />
          <p className="text-sm font-medium text-[var(--text-secondary)]">{items.length === 0 ? "No items yet" : "No items match your filters"}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{items.length === 0 ? "Add materials and services to quickly build quotes and invoices" : "Try adjusting your filters"}</p>
          {items.length === 0 && <button onClick={openCreate} className="mt-4 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Add first item</button>}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Pricebook items">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Item</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] hidden sm:table-cell">SKU</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Category</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Price</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] hidden lg:table-cell">Margin</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Stock</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const m = getMargin(item);
                  const isLow = !item.is_service && item.quantity_on_hand != null && item.reorder_threshold != null && item.quantity_on_hand <= item.reorder_threshold;
                  return (
                    <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.is_service ? "bg-blue-500/10" : "bg-orange-500/10"}`} aria-hidden>
                            {item.is_service ? <Wrench size={13} className="text-blue-400" /> : <ShoppingCart size={13} className="text-orange-400" />}
                          </span>
                          <div>
                            <p className="font-medium text-[var(--text-primary)] leading-tight">{item.name}</p>
                            {item.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-[180px] truncate">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-[var(--text-muted)]">{item.sku ?? "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {item.category ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                            <Tag size={10} aria-hidden />{item.category}
                          </span>
                        ) : <span className="text-[var(--text-muted)]/40 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-[var(--text-primary)]">${item.unit_price.toFixed(2)}</span>
                        <span className="text-xs text-[var(--text-muted)] ml-1">/{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {m != null ? (
                          <span className={`text-xs font-semibold ${m >= 40 ? "text-emerald-400" : m >= 20 ? "text-amber-400" : "text-red-400"}`}>{m}%</span>
                        ) : <span className="text-[var(--text-muted)]/40 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {item.is_service ? <span className="text-[var(--text-muted)]/40 text-xs">N/A</span>
                          : item.quantity_on_hand != null ? (
                            <span className={`text-xs font-semibold tabular-nums ${isLow ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
                              {isLow && <AlertTriangle size={10} className="inline mr-1" aria-label="Low stock" />}
                              {item.quantity_on_hand}
                            </span>
                          ) : <span className="text-[var(--text-muted)]/40 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]" aria-label={`Edit ${item.name}`}>
                            <Edit2 size={13} aria-hidden />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.name)} disabled={deleting === item.id} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50" aria-label={`Delete ${item.name}`}>
                            <Trash2 size={13} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            Showing {filtered.length} of {items.length} items
          </div>
        </div>
      )}

      {showForm && (
        <div role="dialog" aria-modal="true" aria-labelledby="pb-form-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-y-auto" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 id="pb-form-title" className="text-base font-semibold text-[var(--text-primary)]">{editingId ? "Edit Item" : "Add Item"}</h2>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-white/10 transition-colors" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
                <button type="button" onClick={() => setForm(f => ({ ...f, is_service: false }))} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${!form.is_service ? "bg-orange-500/20 text-orange-400" : "text-[var(--text-muted)] hover:bg-white/5"}`} aria-pressed={!form.is_service}><ShoppingCart size={14} aria-hidden />Product / Material</button>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_service: true }))} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${form.is_service ? "bg-blue-500/20 text-blue-400" : "text-[var(--text-muted)] hover:bg-white/5"}`} aria-pressed={form.is_service}><Wrench size={14} aria-hidden />Service / Labour</button>
              </div>
              <div>
                <label htmlFor="pb-name" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Name <span className="text-red-500" aria-hidden>*</span></label>
                <input id="pb-name" ref={nameRef} type="text" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: "" })); }} placeholder={form.is_service ? "e.g. Labour — General" : "e.g. Copper pipe 15mm"} className={`${inputCls} ${formErrors.name ? "border-red-500" : ""}`} aria-required="true" aria-invalid={!!formErrors.name} />
                {formErrors.name && <p className="mt-1 text-xs text-red-400" role="alert">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="pb-desc" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Description</label>
                <input id="pb-desc" type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pb-price" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Sell Price (ex GST) <span className="text-red-500" aria-hidden>*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]" aria-hidden>$</span>
                    <input id="pb-price" type="number" min="0" step="0.01" value={form.unit_price} onChange={e => { setForm(f => ({ ...f, unit_price: e.target.value })); setFormErrors(fe => ({ ...fe, unit_price: "" })); }} className={`${inputCls} pl-7 ${formErrors.unit_price ? "border-red-500" : ""}`} aria-required="true" aria-invalid={!!formErrors.unit_price} />
                  </div>
                  {formErrors.unit_price && <p className="mt-1 text-xs text-red-400" role="alert">{formErrors.unit_price}</p>}
                </div>
                <div>
                  <label htmlFor="pb-unit" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Unit</label>
                  <select id="pb-unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={inputCls}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pb-cost" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Cost Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]" aria-hidden>$</span>
                    <input id="pb-cost" type="number" min="0" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="Optional" className={`${inputCls} pl-7`} />
                  </div>
                  {form.cost_price && form.unit_price && Number(form.unit_price) > 0 && (
                    <p className="mt-1 text-xs text-emerald-400">Margin: {Math.round(((Number(form.unit_price) - Number(form.cost_price)) / Number(form.unit_price)) * 100)}%</p>
                  )}
                </div>
                <div>
                  <label htmlFor="pb-cat" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Category</label>
                  <input id="pb-cat" type="text" list="pb-cats" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Plumbing" className={inputCls} />
                  <datalist id="pb-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div>
                <label htmlFor="pb-sku" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">SKU / Product Code</label>
                <input id="pb-sku" type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Optional" className={inputCls} />
              </div>
              {!form.is_service && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pb-qty" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Qty on Hand</label>
                    <input id="pb-qty" type="number" min="0" step="1" value={form.quantity_on_hand} onChange={e => setForm(f => ({ ...f, quantity_on_hand: e.target.value }))} placeholder="Leave blank to skip" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="pb-reorder" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Reorder When Below</label>
                    <input id="pb-reorder" type="number" min="0" step="1" value={form.reorder_threshold} onChange={e => setForm(f => ({ ...f, reorder_threshold: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
                  <p className="text-xs text-[var(--text-muted)]">Show when building quotes and invoices</p>
                </div>
                <button type="button" role="switch" aria-checked={form.is_active} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${form.is_active ? "bg-[var(--accent-color)]" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 transition-colors">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]">
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add to Pricebook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
