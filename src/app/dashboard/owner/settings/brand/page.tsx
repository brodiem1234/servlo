"use client";

import { useEffect, useState } from "react";

interface BrandState {
  brand_company_name: string;
  brand_email_from_name: string;
  brand_color_primary: string;
  brand_phone: string;
  brand_address: string;
  brand_logo_url: string;
}

const PRESET_COLORS = [
  "#3B82F6", "#0891B2", "#8B5CF6", "#EC4899",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#14B8A6", "#6366F1", "#64748B", "#0F172A",
];

export default function BrandSettingsPage() {
  const [state, setState] = useState<BrandState>({
    brand_company_name: "",
    brand_email_from_name: "",
    brand_color_primary: "",
    brand_phone: "",
    brand_address: "",
    brand_logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    fetch("/api/brand/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.brand) setState(d.brand);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/brand/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2 MB");
      return;
    }
    setLogoUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/brand/logo", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setState((s) => ({ ...s, brand_logo_url: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <a
          href="/dashboard/owner/settings?tab=workspace"
          className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span aria-hidden>←</span> Back to Settings
        </a>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Brand Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Customise how your business appears on client-facing documents, emails, and the client portal.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          Loading brand settings…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Logo</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Shown on invoices, quotes, and the client portal. PNG or SVG recommended, max 2 MB.
            </p>
            {state.brand_logo_url ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.brand_logo_url}
                  alt="Business logo"
                  className="h-16 w-auto rounded border border-[var(--border)] bg-white/10 p-1 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, brand_logo_url: "" }))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg border-2 border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)] hover:border-[var(--accent-color)] transition-colors">
                  {logoUploading ? "Uploading…" : "Click to upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Brand identity */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Brand Identity</h2>

            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Company name (on documents)
              </label>
              <input
                className={inputClass}
                placeholder="Leave blank to use your trading name"
                value={state.brand_company_name}
                onChange={(e) => setState((s) => ({ ...s, brand_company_name: e.target.value }))}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Overrides your trading name on invoices, quotes, and emails.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Email from name
              </label>
              <input
                className={inputClass}
                placeholder="e.g. ACME Plumbing"
                value={state.brand_email_from_name}
                onChange={(e) => setState((s) => ({ ...s, brand_email_from_name: e.target.value }))}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Appears as the sender name in client emails.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Contact phone (on documents)
              </label>
              <input
                className={inputClass}
                placeholder="e.g. 0400 000 000"
                value={state.brand_phone}
                onChange={(e) => setState((s) => ({ ...s, brand_phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Address (on documents)
              </label>
              <input
                className={inputClass}
                placeholder="e.g. 123 Main Street, Sydney NSW 2000"
                value={state.brand_address}
                onChange={(e) => setState((s) => ({ ...s, brand_address: e.target.value }))}
              />
            </div>
          </div>

          {/* Brand colour */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Brand Colour</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Applied to headings, table headers, and accents on invoices and quotes. Choose a preset or enter a custom hex.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, brand_color_primary: hex }))}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    state.brand_color_primary === hex
                      ? "border-[var(--text-primary)] scale-110"
                      : "border-transparent"
                  }`}
                  style={{ background: hex }}
                  title={hex}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={state.brand_color_primary || "#3B82F6"}
                onChange={(e) => setState((s) => ({ ...s, brand_color_primary: e.target.value }))}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] p-0.5"
              />
              <input
                className="h-10 w-36 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                placeholder="#3B82F6"
                value={state.brand_color_primary}
                onChange={(e) => setState((s) => ({ ...s, brand_color_primary: e.target.value }))}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              {state.brand_color_primary && (
                <span
                  className="inline-flex h-8 items-center rounded px-3 text-xs font-semibold text-white"
                  style={{ background: state.brand_color_primary }}
                >
                  Preview
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Leave blank to use your dashboard accent colour.
            </p>
          </div>

          {/* Actions */}
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
              Brand settings saved.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save brand settings"}
          </button>
        </form>
      )}
    </section>
  );
}
