"use client";

import { useState, useRef, useTransition } from "react";

export type PricebookItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  unit_price: number;
  category: string | null;
  sku: string | null;
  taxable: boolean;
  is_active: boolean;
  created_at: string;
};

type Props = {
  initialItems: PricebookItem[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  importCsvAction: (formData: FormData) => Promise<{ ok: boolean; imported: number; errors: string[] }>;
};

const UNITS = ["each", "hour", "m²", "m³", "m", "kg", "L", "day", "job", "lot"];
const CATEGORIES = ["Labour", "Materials", "Equipment", "Travel", "Other"];

const emptyForm = {
  id: "",
  name: "",
  description: "",
  unit: "each",
  unit_price: "0.00",
  category: "",
  sku: "",
  taxable: true,
  is_active: true,
};

type FormState = typeof emptyForm;

const inputCls =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

export function PricebookClient({ initialItems, createAction, updateAction, deleteAction, importCsvAction }: Props) {
  const [items, setItems] = useState<PricebookItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<{ ok: boolean; imported: number; errors: string[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.sku ?? "").toLowerCase().includes(q) || (item.category ?? "").toLowerCase().includes(q);
    const matchCat = !categoryFilter || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

  function openCreate() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(true);
  }

  function openEdit(item: PricebookItem) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      unit: item.unit ?? "each",
      unit_price: item.unit_price.toFixed(2),
      category: item.category ?? "",
      sku: item.sku ?? "",
      taxable: item.taxable,
      is_active: item.is_active,
    });
    setEditing(true);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // ensure boolean fields
    fd.set("taxable", form.taxable ? "true" : "false");
    fd.set("is_active", form.is_active ? "true" : "false");
    startTransition(async () => {
      if (editing) {
        await updateAction(fd);
        setItems((prev) =>
          prev.map((i) =>
            i.id === form.id
              ? { ...i, name: form.name, description: form.description || null, unit: form.unit || null, unit_price: Number(form.unit_price), category: form.category || null, sku: form.sku || null, taxable: form.taxable, is_active: form.is_active }
              : i
          )
        );
      } else {
        await createAction(fd);
        // Optimistic: re-fetch done by revalidatePath; just close form
      }
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteAction(fd);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setConfirmDelete(null);
    });
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("csv", file);
    startTransition(async () => {
      const result = await importCsvAction(fd);
      setImportResult(result);
      if (result.ok) {
        // Reload page to show new items — server revalidated
        window.location.reload();
      }
    });
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a
            href="/dashboard/owner/finance"
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span aria-hidden>←</span> Back to Finance
          </a>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pricebook</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Reusable materials, labour, and service items. Add them to quotes and invoices in one click.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            disabled={isPending}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
          >
            Import CSV
          </button>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + Add item
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResult ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${importResult.ok ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"}`}>
          {importResult.ok
            ? `Imported ${importResult.imported} item${importResult.imported !== 1 ? "s" : ""} successfully.`
            : `Import failed: ${importResult.errors.join("; ")}`}
          <button className="ml-3 underline text-xs" onClick={() => setImportResult(null)}>Dismiss</button>
        </div>
      ) : null}

      {/* CSV format hint */}
      <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-xs text-[var(--text-muted)]">
        <summary className="cursor-pointer font-medium">CSV format guide</summary>
        <p className="mt-2">Required column: <code className="bg-[var(--bg-card)] px-1 rounded">name</code>. Optional: <code className="bg-[var(--bg-card)] px-1 rounded">description, unit, unit_price, category, sku</code></p>
        <p className="mt-1">Example: <code className="bg-[var(--bg-card)] px-1 rounded">name,unit,unit_price,category</code></p>
        <p className="mt-0.5"><code className="bg-[var(--bg-card)] px-1 rounded">Supply &amp; Install Tap,each,185.00,Materials</code></p>
      </details>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="h-9 w-64 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="self-center text-xs text-[var(--text-muted)]">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
          <p className="text-base font-semibold text-[var(--text-primary)]">No pricebook items</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Add materials, labour rates, or services to use them in quotes and invoices.</p>
          <button onClick={openCreate} className="mt-4 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add your first item
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">SKU</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
              {filtered.map((item) => (
                <tr key={item.id} className={`hover:bg-[var(--bg-secondary)] transition-colors ${!item.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                    {item.description ? <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{item.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{item.category ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{item.unit ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                    ${Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs">{item.sku ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block h-2 w-2 rounded-full ${item.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded px-2 py-1 text-xs font-medium text-[var(--accent-color)] hover:bg-[var(--bg-secondary)]"
                      >
                        Edit
                      </button>
                      {confirmDelete === item.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 font-semibold hover:underline">Confirm</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-[var(--text-muted)] hover:underline">Cancel</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal form */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {editing ? "Edit pricebook item" : "Add pricebook item"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {editing ? <input type="hidden" name="id" value={form.id} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Name *</label>
                  <input name="name" required className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Replace tap washer" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Description</label>
                  <input name="description" className={inputCls} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional details" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Unit price ($)</label>
                  <input name="unit_price" type="number" step="0.01" min="0" required className={inputCls} value={form.unit_price} onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Unit</label>
                  <input name="unit" className={inputCls} list="unit-suggestions" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="each" />
                  <datalist id="unit-suggestions">
                    {UNITS.map((u) => <option key={u} value={u} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Category</label>
                  <input name="category" className={inputCls} list="category-suggestions" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Materials" />
                  <datalist id="category-suggestions">
                    {CATEGORIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">SKU / Part no.</label>
                  <input name="sku" className={inputCls} value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                    <input type="checkbox" checked={form.taxable} onChange={(e) => setForm((p) => ({ ...p, taxable: e.target.checked }))} className="h-4 w-4 rounded" />
                    GST applicable (10%)
                  </label>
                  {editing ? (
                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded" />
                      Active
                    </label>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {isPending ? "Saving…" : editing ? "Save changes" : "Add item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
