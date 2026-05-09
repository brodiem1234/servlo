"use client";

import { useState, useEffect, useRef } from "react";

type ClientProperty = {
  id: string;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  property_type: string | null;
  notes: string | null;
  created_at: string;
};

type Props = {
  clientId: string;
};

const PROPERTY_TYPES = ["residential", "commercial", "industrial"] as const;

function propertyTypeBadge(t: string | null) {
  const v = (t ?? "residential").toLowerCase();
  if (v === "commercial") return "bg-sky-100 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800";
  if (v === "industrial") return "bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800";
  return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800";
}

const emptyForm = { address: "", suburb: "", state: "", postcode: "", property_type: "residential", notes: "" };

export default function ClientPropertiesTab({ clientId }: Props) {
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/clients/${clientId}/properties`)
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => setError("Failed to load properties."))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add property.");
      } else {
        setProperties((prev) => [...prev, data.property]);
        setForm({ ...emptyForm });
        setShowForm(false);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder?: string, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
      />
    </div>
  );

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Properties</h3>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent-color)] px-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition"
          >
            + Add Property
          </button>
        ) : null}
      </div>

      {/* Add property form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">New Property</p>
          {field("address", "Address *", "123 Example St")}
          <div className="grid gap-3 sm:grid-cols-3">
            {field("suburb", "Suburb", "Melbourne")}
            {field("state", "State", "VIC")}
            {field("postcode", "Postcode", "3000")}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">Property Type</label>
            <select
              value={form.property_type}
              onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Any notes about this property…"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !form.address.trim()}
              className="inline-flex h-9 items-center rounded-lg bg-[var(--accent-color)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition"
            >
              {submitting ? "Saving…" : "Save Property"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); setForm({ ...emptyForm }); }}
              className="inline-flex h-9 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Properties list */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading properties…</p>
      ) : properties.length === 0 && !showForm ? (
        <p className="text-sm text-[var(--text-muted)]">No properties on record.</p>
      ) : (
        <ul className="space-y-3">
          {properties.map((p) => (
            <li key={p.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{p.address}</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${propertyTypeBadge(p.property_type)}`}>
                  {p.property_type ?? "residential"}
                </span>
              </div>
              {(p.suburb || p.state || p.postcode) ? (
                <p className="text-xs text-[var(--text-muted)]">
                  {[p.suburb, p.state, p.postcode].filter(Boolean).join(", ")}
                </p>
              ) : null}
              {p.notes ? (
                <p className="text-xs text-[var(--text-secondary)] italic">{p.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
