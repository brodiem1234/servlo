"use client";

import { useEffect, useState } from "react";

export default function BookingSettingsPage() {
  const [slug, setSlug] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [serviceTypes, setServiceTypes] = useState("General service\nEmergency call-out\nQuote / assessment\nMaintenance\nInstallation\nRepair\nInspection");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/booking/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSlug(d.settings.booking_slug ?? "");
          setEnabled(d.settings.booking_enabled ?? false);
          setServiceTypes((d.settings.booking_service_types ?? []).join("\n") || serviceTypes);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/booking/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          booking_enabled: enabled,
          booking_service_types: serviceTypes.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Save failed");
      }
      setSlug(slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
  const bookingUrl = slug ? `${appUrl}/book/${slug}` : null;
  const embedCode = bookingUrl
    ? `<iframe src="${bookingUrl}" width="100%" height="680" frameborder="0" style="border-radius:12px;"></iframe>`
    : null;

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <a href="/dashboard/owner/settings" className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <span>←</span> Back to Settings
        </a>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Online Booking Widget</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Give clients a public booking page they can use to request a service. Embed it on your website.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Enable online booking</p>
                <p className="text-xs text-[var(--text-muted)]">When off, the booking page shows a &quot;not available&quot; message.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((p) => !p)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-[var(--accent-color)]" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Booking page URL slug *</label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--text-muted)] break-all">{appUrl}/book/</span>
                <input
                  required
                  className={`${inputCls} min-w-0 flex-1 basis-32`}
                  placeholder="acme-plumbing"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">Lowercase letters, numbers, and hyphens only.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Service types (one per line)</label>
              <textarea
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                rows={6}
                value={serviceTypes}
                onChange={(e) => setServiceTypes(e.target.value)}
              />
              <p className="text-xs text-[var(--text-muted)]">These appear as dropdown options on the booking form.</p>
            </div>
          </div>

          {/* Booking link and embed */}
          {bookingUrl ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Your booking page</h2>
              <div className="flex items-center gap-2">
                <a href={bookingUrl} target="_blank" rel="noreferrer" className="text-sm text-[var(--accent-color)] hover:underline break-all">{bookingUrl}</a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(bookingUrl)}
                  className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                >
                  Copy
                </button>
              </div>
              {embedCode ? (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--text-muted)]">Embed on your website:</p>
                  <pre className="rounded bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-muted)] overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(embedCode)}
                    className="rounded border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                  >
                    Copy embed code
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>
          ) : null}
          {saved ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">Booking settings saved.</div>
          ) : null}

          <button type="submit" disabled={saving} className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save booking settings"}
          </button>
        </form>
      )}
    </section>
  );
}
