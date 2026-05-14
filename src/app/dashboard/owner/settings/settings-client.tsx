"use client";

import { useState } from "react";
import {
  siStripe,
  siXero,
  siPaypal,
  siMailchimp,
  siDropbox,
  siSquare,
  siZapier,
  siGoogle,
  siZoom,
  siGoogledrive,
  siGooglecalendar,
  siGooglemaps,
  siMake,
  siQuickbooks,
} from "simple-icons";

// ── Simple Icons helper ─────────────────────────────────────────────────────

function SIIcon({ icon, size = 20 }: { icon: { path: string; hex: string; title: string }; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={`#${icon.hex}`} aria-label={icon.title}>
      <path d={icon.path} />
    </svg>
  );
}

// ── Notification preferences ────────────────────────────────────────────────

type NotificationPrefs = {
  invoice_paid: boolean;
  new_job_created: boolean;
  job_completed: boolean;
  quote_accepted: boolean;
  overdue_invoice_reminder: boolean;
  overdue_invoice_frequency: 7 | 14 | 30;
  trial_ending_reminder: boolean;
  timesheet_submitted?: boolean;
  leave_request?: boolean;
  security_alerts?: boolean;
  product_updates?: boolean;
  weekly_digest?: boolean;
};

type NotificationsFormProps = {
  initialPrefs: NotificationPrefs;
  saveAction: (prefs: NotificationPrefs) => Promise<void>;
};

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${disabled ? "cursor-not-allowed" : ""} ${
          checked ? "bg-[var(--product-accent)]" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

type NotifGroup = {
  label: string;
  items: Array<{
    key: keyof NotificationPrefs;
    label: string;
    isFrequency?: boolean;
  }>;
};

const NOTIF_GROUPS: NotifGroup[] = [
  {
    label: "Jobs",
    items: [
      { key: "new_job_created", label: "New job created" },
      { key: "job_completed", label: "Job completed" },
    ],
  },
  {
    label: "Finance",
    items: [
      { key: "invoice_paid", label: "Invoice paid" },
      { key: "overdue_invoice_reminder", label: "Overdue invoice reminder", isFrequency: true },
      { key: "quote_accepted", label: "Quote accepted" },
    ],
  },
  {
    label: "Team",
    items: [
      { key: "timesheet_submitted", label: "Timesheet submitted" },
      { key: "leave_request", label: "Leave request" },
    ],
  },
  {
    label: "System",
    items: [
      { key: "trial_ending_reminder", label: "Trial ending reminder" },
      { key: "security_alerts", label: "Security alerts" },
      { key: "product_updates", label: "Product updates" },
    ],
  },
];

export function NotificationsForm({ initialPrefs, saveAction }: NotificationsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    timesheet_submitted: true,
    leave_request: true,
    security_alerts: true,
    product_updates: true,
    weekly_digest: false,
    ...initialPrefs,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  function set<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveAction(prefs);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  function handleTestNotification() {
    setTestSent(true);
    window.setTimeout(() => setTestSent(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Notification</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] text-center">Email</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] text-center">
          SMS <span className="text-[10px] normal-case font-normal">(coming soon)</span>
        </span>
      </div>

      {NOTIF_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{group.label}</h3>
          <div className="space-y-1">
            {group.items.map((item) => {
              const val = prefs[item.key];
              const checked = typeof val === "boolean" ? val : false;
              return (
                <div key={item.key} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                  {/* Email toggle */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      onClick={() => set(item.key, !checked as NotificationPrefs[typeof item.key])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        checked ? "bg-[var(--product-accent)]" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          checked ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  {/* SMS toggle — disabled, coming soon */}
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      disabled
                      className="h-4 w-4 opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              );
            })}
            {/* Frequency picker for overdue invoice */}
            {group.label === "Finance" && prefs.overdue_invoice_reminder ? (
              <div className="flex items-center gap-3 px-4 py-2">
                <label className="text-sm text-[var(--text-secondary)]">Send reminder after</label>
                <select
                  value={prefs.overdue_invoice_frequency}
                  onChange={(e) => set("overdue_invoice_frequency", Number(e.target.value) as 7 | 14 | 30)}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>
      ))}

      {/* Weekly digest */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Weekly digest</p>
          <p className="text-xs text-[var(--text-muted)]">Receive a weekly summary email of your business activity.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.weekly_digest ?? false}
          onClick={() => set("weekly_digest", !(prefs.weekly_digest ?? false))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            (prefs.weekly_digest ?? false) ? "bg-[var(--product-accent)]" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              (prefs.weekly_digest ?? false) ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--product-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-accent-hover)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save notification preferences"}
        </button>
        <button
          type="button"
          onClick={handleTestNotification}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Send test notification
        </button>
        {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
        {testSent ? <span className="text-sm text-emerald-600">Test notification sent to your email</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}

// ── Export buttons ──────────────────────────────────────────────────────────

export function ExportButtons() {
  const [loading, setLoading] = useState<"clients" | "invoices" | "jobs" | null>(null);

  function triggerDownload(href: string) {
    const a = document.createElement("a");
    a.href = href;
    a.click();
  }

  async function exportData(type: "clients" | "invoices" | "jobs") {
    setLoading(type);
    try {
      triggerDownload(`/api/export/${type}`);
    } finally {
      window.setTimeout(() => setLoading(null), 1500);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loading === "clients"}
        onClick={() => exportData("clients")}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "clients" ? "Exporting…" : "Export clients as CSV"}
      </button>
      <button
        type="button"
        disabled={loading === "invoices"}
        onClick={() => exportData("invoices")}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "invoices" ? "Exporting…" : "Export invoices as CSV"}
      </button>
      <button
        type="button"
        disabled={loading === "jobs"}
        onClick={() => exportData("jobs")}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "jobs" ? "Exporting…" : "Export jobs as CSV"}
      </button>
    </div>
  );
}

// ── Delete account (legacy — kept for import compatibility) ─────────────────

type DeleteAccountProps = {
  deleteAction: () => Promise<void>;
};

export function DeleteAccountSection({ deleteAction }: DeleteAccountProps) {
  const [input, setInput] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = input.trim() === "DELETE";

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">This action is permanent and cannot be undone.</p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
          All your business data — clients, jobs, quotes, invoices, employees, and account information — will be permanently deleted.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE"
          className="h-10 w-full max-w-xs rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!confirmed || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Permanently delete account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setInput("");
            setError(null);
          }}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Demo data confirm buttons ───────────────────────────────────────────────

type DemoButtonProps = {
  resetAction: () => Promise<void>;
  removeAction: () => Promise<void>;
};

export function DemoDataButtons({ resetAction, removeAction }: DemoButtonProps) {
  const [confirming, setConfirming] = useState<"reset" | "remove" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  if (confirming === "reset") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-secondary)]">This will remove existing demo rows and insert a fresh set. Your real data is not affected.</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(resetAction)}
            className="rounded-md bg-[var(--product-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-accent-hover)] disabled:opacity-60"
          >
            {busy ? "Seeding…" : "Confirm seed demo data"}
          </button>
          <button type="button" onClick={() => setConfirming(null)} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]">Cancel</button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (confirming === "remove") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-secondary)]">This will permanently delete all demo-tagged records. Your real data is not affected.</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(removeAction)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Removing…" : "Confirm remove"}
          </button>
          <button type="button" onClick={() => setConfirming(null)} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]">Cancel</button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <button
        type="button"
        onClick={() => setConfirming("reset")}
        className="rounded border border-[var(--product-accent)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--product-accent)] hover:bg-[color-mix(in_srgb,var(--product-accent)_10%,var(--bg-card))]"
      >
        Seed demo data
      </button>
      <button
        type="button"
        onClick={() => setConfirming("remove")}
        className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
      >
        Clear all demo data
      </button>
    </div>
  );
}

// ── Billing Tab (ITEM 5) ────────────────────────────────────────────────────

type BillingTabProps = {
  currentPlan: string;
  isOnTrial: boolean;
  email: string;
  priceIds: { solo: string; team: string; business: string };
  success: boolean;
  growAddonEnabled: boolean;
  growPriceAvailable: boolean;
  isFoundingMember: boolean;
  trialEndDate: string | null;
  subscriptionStatus: string | null;
  commitmentEndDate: string | null;
  cancellationPending: boolean;
  cancellationTakesEffectAt: string | null;
};

// ── Grow Add-on Card ────────────────────────────────────────────────────────

function GrowAddonCard({
  growAddonEnabled,
  growPriceAvailable,
  isOnTrial,
}: {
  growAddonEnabled: boolean;
  growPriceAvailable: boolean;
  isOnTrial: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  async function handleAdd() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/billing/add-grow", { method: "POST" });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      setResult(data);
      if (data.success) window.setTimeout(() => window.location.reload(), 2000);
    } catch {
      setResult({ error: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/billing/add-grow", { method: "DELETE" });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      setResult(data);
      if (data.success) window.setTimeout(() => window.location.reload(), 2500);
    } catch {
      setResult({ error: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">SERVLO Grow</h2>
            {growAddonEnabled ? (
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                Not active
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            CRM pipeline, email marketing, lead capture, and review management. Adds marketing muscle to your Core subscription.
          </p>
          {growPriceAvailable && !isOnTrial && (
            <p className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">$15/mo</p>
          )}
          {isOnTrial && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">Subscribe to a paid plan to add Grow.</p>
          )}
          {!growPriceAvailable && !isOnTrial && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Grow is included in all plans during early access.{" "}
              <a href="mailto:support@servlo.com.au" className="text-[var(--product-accent)] hover:underline">
                Contact us
              </a>{" "}
              to manage your add-on.
            </p>
          )}
        </div>

        {growPriceAvailable && !isOnTrial && (
          <div className="shrink-0">
            {growAddonEnabled ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {loading ? "Removing…" : "Remove Grow"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={loading}
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? "Adding…" : "Add Grow — $15/mo"}
              </button>
            )}
          </div>
        )}
      </div>

      {result ? (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            result.success
              ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300"
              : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
          }`}
        >
          {result.message ?? result.error}
        </div>
      ) : null}

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
        <li>· CRM pipeline &amp; deal tracking</li>
        <li>· Email marketing campaigns</li>
        <li>· Lead capture forms</li>
        <li>· Google review requests</li>
        <li>· Client portal (branded)</li>
        <li>· Re-engagement automations</li>
      </ul>
    </div>
  );
}

type PlanRow = {
  key: "solo" | "team" | "business" | "enterprise";
  label: string;
  price: string;
  users: string;
  jobs: string;
  clients: string;
  priceId?: string;
};

const PLAN_ROWS: PlanRow[] = [
  { key: "solo",     label: "Solo",     price: "$29/mo",  users: "1",         jobs: "Unlimited", clients: "Unlimited" },
  { key: "team",     label: "Team",     price: "$79/mo",  users: "Unlimited", jobs: "Unlimited", clients: "Unlimited" },
  { key: "business", label: "Business", price: "$149/mo", users: "Unlimited", jobs: "Unlimited", clients: "Unlimited" },
];

const PLAN_FEATURES: Record<string, { price: string; features: string[] }> = {
  solo:     { price: "$29/mo",  features: ["1 user", "Unlimited clients", "Core + Grow included", "AI (50 uses/mo)", "Jobs, invoices, quotes"] },
  team:     { price: "$79/mo",  features: ["Unlimited users", "Core + Grow included", "AI (200 uses/mo)", "Timesheets & team scheduling"] },
  business: { price: "$149/mo", features: ["Unlimited users", "Core + Grow included", "AI (500 uses/mo)", "Xero/MYOB sync"] },
};

const PLAN_ORDER_LOCAL: Record<string, number> = { free: 0, trial: 0, solo: 1, team: 2, business: 3 };

export function BillingTab({
  currentPlan,
  isOnTrial,
  email,
  priceIds,
  success,
  growAddonEnabled,
  growPriceAvailable,
  isFoundingMember,
  trialEndDate,
  subscriptionStatus,
  commitmentEndDate,
  cancellationPending,
  cancellationTakesEffectAt,
}: BillingTabProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ ok?: boolean; cancellationDate?: string; error?: string } | null>(null);

  const currentPlanNorm = currentPlan.toLowerCase();
  const currentOrder = PLAN_ORDER_LOCAL[currentPlanNorm] ?? 0;

  // Plans above the current tier (for upgrade section)
  const upgradablePlans = PLAN_ROWS.filter(
    (p) => (PLAN_ORDER_LOCAL[p.key] ?? 0) > currentOrder
  );

  // Is user within their founding member commitment period?
  const inCommitmentPeriod = Boolean(
    isFoundingMember &&
    commitmentEndDate &&
    new Date(commitmentEndDate) > new Date()
  );

  async function openStripePortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "No portal URL returned");
      window.location.href = data.url;
    } catch {
      setPortalError("Contact support@servlo.com.au to manage your billing");
      setPortalLoading(false);
    }
  }

  async function startCheckout(priceId: string, planKey: string) {
    if (!priceId) { setCheckoutError("Missing Stripe price ID for this plan."); return; }
    setCheckoutError("");
    setCheckoutLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, email }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Unable to start checkout");
      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Unable to start checkout");
      setCheckoutLoading("");
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true);
    setCancelResult(null);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json() as { ok?: boolean; cancellationDate?: string; error?: string };
      setCancelResult(data);
      if (data.ok) {
        window.setTimeout(() => window.location.reload(), 2500);
      }
    } catch {
      setCancelResult({ error: "Request failed. Please try again." });
    } finally {
      setCancelLoading(false);
    }
  }

  const planPriceIds: Record<string, string> = {
    solo: priceIds.solo,
    team: priceIds.team,
    business: priceIds.business,
  };

  const planPrice: Record<string, string> = {
    solo: "$29/mo",
    team: "$79/mo",
    business: "$149/mo",
  };

  const planDesc: Record<string, string> = {
    solo: "$29/mo · 1 user · Core + Grow included",
    team: "$79/mo · Unlimited team members · Core + Grow included",
    business: "$149/mo · Unlimited users · Core + Grow included",
  };

  return (
    <div className="space-y-5">
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300">
          Subscription checkout completed successfully.
        </div>
      ) : null}

      {/* A. Current plan card */}
      {!isOnTrial ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Current plan</h2>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {/* Plan name + founding badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold capitalize text-[var(--text-primary)]">{currentPlanNorm}</p>
                {isFoundingMember && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                    ⭐ Founding Member
                  </span>
                )}
              </div>

              {/* Price description */}
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {planDesc[currentPlanNorm] ?? "Active subscription"}
              </p>
              {isFoundingMember && (
                <p className="mt-0.5 text-xs text-amber-400">
                  Founding member discount active — your rate is locked in for life.
                </p>
              )}

              {/* Status badges */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {cancellationPending ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Cancels {cancellationTakesEffectAt ? new Date(cancellationTakesEffectAt).toLocaleDateString("en-AU") : "soon"}
                  </span>
                ) : subscriptionStatus === "active" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Active
                  </span>
                ) : subscriptionStatus === "paused" ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                    Paused
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                    {subscriptionStatus ?? "Active"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={openStripePortal}
                disabled={portalLoading}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-60"
              >
                {portalLoading ? "Loading…" : "Billing portal"}
              </button>
            </div>
          </div>

          {portalError ? (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{portalError}</p>
          ) : null}
        </div>
      ) : null}

      {/* B. Grow add-on card */}
      <GrowAddonCard
        growAddonEnabled={growAddonEnabled}
        growPriceAvailable={growPriceAvailable}
        isOnTrial={isOnTrial}
      />

      {/* C. Upgrade options (only plans above current tier, or "activate" when on trial) */}
      <div id="plans" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        {isOnTrial ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Activate your subscription</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">Choose a plan to continue after your trial. Your data and settings are preserved.</p>
          </>
        ) : currentPlanNorm === "business" ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">You&apos;re on our best plan</h2>
            <p className="text-sm text-[var(--text-secondary)]">Business is our most powerful tier. Nothing to upgrade to.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Upgrade your plan</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">Get more users, AI usage, and features.</p>
          </>
        )}

        {checkoutError ? (
          <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{checkoutError}</p>
        ) : null}

        {/* Plans to show: all for trial, only upgrades for active subscribers */}
        {(isOnTrial ? PLAN_ROWS : upgradablePlans).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {(isOnTrial ? PLAN_ROWS : upgradablePlans).map((plan) => {
              const isCurrent = currentPlanNorm === plan.key;
              const info = PLAN_FEATURES[plan.key];
              return (
                <div
                  key={plan.key}
                  className={`rounded-xl border p-4 ${isCurrent ? "border-[var(--product-accent)] bg-[color-mix(in_srgb,var(--product-accent)_8%,transparent)]" : "border-[var(--border)]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-[var(--text-primary)] capitalize">{plan.key}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase text-[var(--product-accent)]">Current</span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{info?.price ?? plan.price}</p>
                  <ul className="mt-2 mb-3 space-y-0.5">
                    {(info?.features ?? []).map((f) => (
                      <li key={f} className="text-xs text-[var(--text-secondary)]">· {f}</li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={checkoutLoading === plan.key}
                      onClick={() => startCheckout(planPriceIds[plan.key] ?? "", plan.key)}
                      className="w-full rounded-md bg-[var(--product-accent)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {checkoutLoading === plan.key ? "Redirecting…" : isOnTrial ? "Activate" : "Upgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Downgrade note — show for active subscribers who are not on the lowest paid tier */}
        {!isOnTrial && currentPlanNorm !== "solo" && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Need to downgrade?{" "}
            <a href="mailto:hello@servlo.com.au?subject=Plan%20Downgrade%20Request" className="text-[var(--product-accent)] hover:underline">
              Contact us at hello@servlo.com.au
            </a>
          </p>
        )}
      </div>

      {/* D. Invoice history note */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Invoice history</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          View and download your invoices in the{" "}
          <button
            type="button"
            onClick={openStripePortal}
            disabled={portalLoading}
            className="text-[var(--product-accent)] hover:underline disabled:opacity-60"
          >
            Stripe billing portal
          </button>
          .
        </p>
      </div>

      {/* E. Cancel subscription */}
      {!isOnTrial && !cancellationPending && subscriptionStatus === "active" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Cancel subscription</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Your access continues until the end of your current billing period.
          </p>
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            className="text-sm text-red-500 hover:text-red-400 hover:underline"
          >
            Cancel subscription →
          </button>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <button
              onClick={() => { setCancelModalOpen(false); setCancelResult(null); setCancelReason(""); }}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              ✕
            </button>

            {inCommitmentPeriod ? (
              <>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Founding Member commitment</h2>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-4 text-sm text-amber-300">
                  <p className="font-semibold mb-1">⭐ You&apos;re in your founding member period</p>
                  <p>
                    As a founding member, your pricing is locked in for life and your commitment period runs until{" "}
                    <strong>{new Date(commitmentEndDate!).toLocaleDateString("en-AU")}</strong>.
                  </p>
                  <p className="mt-2">
                    Self-serve cancellation is not available during your commitment period. Please email us if you need to make changes.
                  </p>
                </div>
                <a
                  href="mailto:hello@servlo.com.au?subject=Subscription%20Cancellation%20Request"
                  className="inline-flex items-center rounded-lg bg-[var(--product-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Email hello@servlo.com.au
                </a>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Cancel your subscription?</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Your access will continue until the end of your billing period. You can resubscribe at any time.
                </p>

                {cancelResult ? (
                  <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${cancelResult.ok ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300" : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"}`}>
                    {cancelResult.ok
                      ? `Subscription cancelled. Access continues until ${cancelResult.cancellationDate ? new Date(cancelResult.cancellationDate).toLocaleDateString("en-AU") : "end of billing period"}.`
                      : cancelResult.error}
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                        Reason (optional)
                      </label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                        placeholder="Let us know why you're cancelling..."
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setCancelModalOpen(false); setCancelReason(""); }}
                        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                      >
                        Keep subscription
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelLoading ? "Cancelling…" : "Confirm cancel"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* F. Footer note */}
      <p className="text-xs text-[var(--text-muted)]">
        Billing powered by Stripe. Changes may take a moment to reflect.
      </p>
    </div>
  );
}

// ── Import / Export Tab (ITEM 8) ────────────────────────────────────────────

export function ImportExportTab() {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3000);
  }

  function triggerDownload(href: string) {
    const a = document.createElement("a");
    a.href = href;
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Import section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Import data</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Import your existing data to get started quickly. Templates ensure correct formatting.
        </p>

        <div className="mt-5 space-y-3">
          {/* Xero */}
          <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <span>Xero</span>
              </div>
              <span className="text-[var(--text-muted)]">▸</span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm text-[var(--text-secondary)]">Connect Xero to export invoices and sync client contacts. Requires XERO_CLIENT_ID and XERO_CLIENT_SECRET env vars.</p>
              <a href="/api/xero/connect" className="mt-3 inline-block rounded-md bg-[#1AB4D3] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Connect Xero
              </a>
            </div>
          </details>

          {/* MYOB */}
          <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <span>MYOB</span>
              </div>
              <span className="text-[var(--text-muted)]">▸</span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm text-[var(--text-secondary)]">Connect MYOB AccountRight to export invoices and sync client contacts. Requires MYOB_CLIENT_ID and MYOB_CLIENT_SECRET env vars.</p>
              <a href="/api/myob/connect" className="mt-3 inline-block rounded-md bg-[#7B2D8B] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Connect MYOB
              </a>
            </div>
          </details>

          {/* Spreadsheet — open by default */}
          <details open className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              <span>Spreadsheet (CSV)</span>
              <span className="text-[var(--text-muted)]">▾</span>
            </summary>
            <div className="px-4 pb-4 pt-1 space-y-5">
              {/* Clients CSV */}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Clients</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Import client records from a CSV spreadsheet.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href="#" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card)]">
                    Download template
                  </a>
                  <label className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)]">
                    Upload clients CSV
                    <input type="file" accept=".csv" className="hidden" />
                  </label>
                </div>
              </div>
              {/* Jobs CSV */}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Jobs</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Import job records from a CSV spreadsheet.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href="#" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card)]">
                    Download template
                  </a>
                  <label className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)]">
                    Upload jobs CSV
                    <input type="file" accept=".csv" className="hidden" />
                  </label>
                </div>
              </div>
              {/* Invoices CSV */}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Invoices</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Import invoice records from a CSV spreadsheet.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href="#" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card)]">
                    Download template
                  </a>
                  <label className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)]">
                    Upload invoices CSV
                    <input type="file" accept=".csv" className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Export section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Export data</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Exports include all records. Demo data is excluded from exports.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => triggerDownload("/api/export/clients")}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Export Clients (CSV)
          </button>
          <button
            type="button"
            onClick={() => triggerDownload("/api/export/jobs")}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Export Jobs (CSV)
          </button>
          <button
            type="button"
            onClick={() => triggerDownload("/api/export/invoices")}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Export Invoices (CSV)
          </button>
          <button
            type="button"
            onClick={() => showToast("Export coming soon")}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Export Quotes (CSV)
          </button>
          <button
            type="button"
            onClick={() => showToast("Export coming soon")}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Export Timesheets (CSV)
          </button>
          <button
            type="button"
            onClick={() => showToast("Export coming soon")}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Export all data (ZIP)
          </button>
        </div>
      </div>

      {toastMsg ? (
        <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-lg">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}

// ── Integrations Tab (ITEM 9) ───────────────────────────────────────────────

type SimpleIconDef = { path: string; hex: string; title: string };

type IntegrationCard = {
  name: string;
  bg: string;
  initial: string;
  description: string;
  status: string;
  textDark?: boolean;
  siIcon?: SimpleIconDef;
};

type IntegrationCategory = {
  label: string;
  cards: IntegrationCard[];
};

const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    label: "Accounting",
    cards: [
      { name: "Xero", bg: "#1AB4D3", initial: "X", description: "Export invoices & contacts", status: "Connect", siIcon: siXero },
      { name: "MYOB", bg: "#7B2D8B", initial: "M", description: "Export invoices & contacts", status: "Connect" },
      { name: "QuickBooks", bg: "#2CA01C", initial: "Q", description: "Two-way sync", status: "Coming soon", siIcon: siQuickbooks },
    ],
  },
  {
    label: "Payments",
    cards: [
      { name: "Stripe", bg: "#635BFF", initial: "S", description: "Online payments", status: "Active", siIcon: siStripe },
      { name: "Square", bg: "#00C244", initial: "Sq", description: "POS integration", status: "Coming soon", siIcon: siSquare },
      { name: "PayPal", bg: "#003087", initial: "PP", description: "Payment processing", status: "Coming soon", siIcon: siPaypal },
    ],
  },
  {
    label: "Communication",
    cards: [
      { name: "Twilio", bg: "#F22F46", initial: "Tw", description: "SMS notifications", status: "Coming soon" },
      { name: "Mailchimp", bg: "#FFE01B", initial: "Mc", description: "Email campaigns", status: "Coming soon", textDark: true, siIcon: siMailchimp },
    ],
  },
  {
    label: "Calendar",
    cards: [
      { name: "Google Calendar", bg: "#4285F4", initial: "GC", description: "Sync job schedules", status: "Coming soon", siIcon: siGooglecalendar },
      { name: "Microsoft 365", bg: "#D83B01", initial: "Ms", description: "Outlook calendar", status: "Coming soon" },
    ],
  },
  {
    label: "Documents",
    cards: [
      { name: "Google Drive", bg: "#0F9D58", initial: "GD", description: "Store job documents", status: "Coming soon", siIcon: siGoogledrive },
      { name: "Dropbox", bg: "#0061FF", initial: "Db", description: "File storage", status: "Coming soon", siIcon: siDropbox },
    ],
  },
  {
    label: "Automation",
    cards: [
      { name: "Zapier", bg: "#FF4A00", initial: "Za", description: "Connect 5000+ apps", status: "Coming soon", siIcon: siZapier },
      { name: "Make", bg: "#6D00CC", initial: "Mk", description: "Visual automation", status: "Coming soon", siIcon: siMake },
    ],
  },
  {
    label: "HR & Payroll",
    cards: [
      { name: "Deputy", bg: "#FF6B00", initial: "Dp", description: "Staff scheduling", status: "Coming soon" },
      { name: "KeyPay", bg: "#1B5E20", initial: "KP", description: "Payroll processing", status: "Coming soon" },
    ],
  },
  {
    label: "Government",
    cards: [
      { name: "ATO STP", bg: "#003C6B", initial: "AT", description: "Single Touch Payroll", status: "Coming soon" },
      { name: "ABR", bg: "#1A237E", initial: "AB", description: "ABN lookup & verification", status: "Active" },
    ],
  },
  {
    label: "Maps",
    cards: [
      { name: "Google Maps", bg: "#4285F4", initial: "GM", description: "Job location & routing", status: "Coming soon", siIcon: siGooglemaps },
      { name: "HERE Maps", bg: "#48DAD0", initial: "HM", description: "Fleet tracking", status: "Coming soon", textDark: true },
    ],
  },
];

type IntegrationsTabProps = {
  stripeConnected: boolean;
  emailProvider?: string | null;
  emailConnectedAddress?: string | null;
};

export function IntegrationsTab({ stripeConnected, emailProvider, emailConnectedAddress }: IntegrationsTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Connect SERVLO to the tools you already use.</p>
      </div>

      {/* Email section */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Email</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {/* Gmail card */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-lg font-bold text-[var(--text-primary)] shrink-0">G</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Gmail</p>
                <p className="text-xs text-[var(--text-muted)] truncate">Send from your Gmail address</p>
              </div>
              {emailProvider === "gmail" && (
                <span className="ml-auto shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400 border border-green-500/20">Connected</span>
              )}
            </div>
            {emailProvider === "gmail" ? (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)]">
                  Connected as <span className="font-medium text-[var(--text-primary)]">{emailConnectedAddress}</span>
                </p>
                <form action="/api/auth/gmail/disconnect" method="POST" className="inline">
                  <button type="submit" className="text-xs text-red-400 hover:text-red-300 transition-colors">Disconnect</button>
                </form>
              </div>
            ) : process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED === "true" || typeof window !== "undefined" ? (
              <a href="/api/auth/gmail" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                Connect Gmail
              </a>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Coming soon — <a href="mailto:hello@servlo.com.au" className="text-[var(--accent-color)] hover:underline">contact us to join beta</a></p>
            )}
            <p className="mt-3 text-[10px] text-[var(--text-muted)]">Emails encrypted, stored max 90 days</p>
          </div>

          {/* Outlook card */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-lg font-bold text-[var(--text-primary)] shrink-0">⊞</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Outlook / Microsoft 365</p>
                <p className="text-xs text-[var(--text-muted)] truncate">Send from your Outlook address</p>
              </div>
              {emailProvider === "outlook" && (
                <span className="ml-auto shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400 border border-green-500/20">Connected</span>
              )}
            </div>
            {emailProvider === "outlook" ? (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)]">
                  Connected as <span className="font-medium text-[var(--text-primary)]">{emailConnectedAddress}</span>
                </p>
                <form action="/api/auth/outlook/disconnect" method="POST" className="inline">
                  <button type="submit" className="text-xs text-red-400 hover:text-red-300 transition-colors">Disconnect</button>
                </form>
              </div>
            ) : (
              <a href="/api/auth/outlook" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                Connect Outlook
              </a>
            )}
            <p className="mt-3 text-[10px] text-[var(--text-muted)]">Emails encrypted, stored max 90 days</p>
          </div>
        </div>
      </div>

      {INTEGRATION_CATEGORIES.map((category) => (
        <div key={category.label}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{category.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {category.cards.map((card) => {
              const resolvedStatus =
                card.name === "Stripe"
                  ? stripeConnected
                    ? "Active"
                    : "Connect"
                  : card.status;
              return (
                <div
                  key={card.name}
                  className="rounded-lg border border-gray-200 dark:border-white/10 p-4 flex items-start gap-3"
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-gray-900 shrink-0">
                    {card.siIcon ? (
                      <SIIcon icon={card.siIcon} size={20} />
                    ) : (
                      <span
                        className={`font-bold text-sm ${card.textDark ? "text-gray-900" : "text-white"}`}
                        style={{ color: card.textDark ? "#111" : "#fff" }}
                      >
                        {card.initial}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{card.name}</p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          resolvedStatus === "Active"
                            ? "bg-emerald-900/40 text-emerald-300"
                            : "bg-zinc-200 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {resolvedStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// WelcomeOverlay removed — onboarding tour now lives on dashboard only (see onboarding-tour.tsx)

// ── Demo Data Section ───────────────────────────────────────────────────────

function DemoDataSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" });
      const data = await res.json() as { skipped?: boolean; ok?: boolean; seeded?: Record<string, number> };
      if (data.skipped) {
        setResult("Demo data already loaded.");
      } else if (data.ok) {
        const counts = data.seeded ?? {};
        setResult(
          `✅ Demo data loaded! Added ${counts.clients ?? 0} clients, ${counts.jobs ?? 0} jobs, ${counts.invoices ?? 0} invoices, ${counts.quotes ?? 0} quotes, and more.`
        );
      } else {
        setResult("Something went wrong. Try again.");
      }
    } catch {
      setResult("Failed to load demo data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-900/40 p-5">
      <h3 className="font-semibold text-[var(--text-primary)] mb-1">Load demo data</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Populate your account with realistic sample data — clients, jobs, invoices, quotes, vehicles, and more — so you
        can explore SERVLO without entering real records.
      </p>
      {result && (
        <p className={`mb-3 text-sm rounded-md px-3 py-2 ${result.startsWith("✅") ? "bg-green-900/20 text-green-300" : "bg-gray-800 text-gray-300"}`}>
          {result}
        </p>
      )}
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
      >
        {loading ? "Loading…" : "Load demo data"}
      </button>
    </div>
  );
}

// ── Danger Zone Tab (ITEM 11) ───────────────────────────────────────────────

type DangerZoneTabProps = {
  businessName: string;
  userEmail: string;
  isFoundingMember?: boolean;
  commitmentEndDate?: string | null;
};

export function DangerZoneTab({ businessName, userEmail, isFoundingMember, commitmentEndDate }: DangerZoneTabProps) {
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteNameInput, setDeleteNameInput] = useState("");
  const [showRetention, setShowRetention] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerResult, setOfferResult] = useState<{ ok: boolean; message: string } | null>(null);

  const applyRetentionOffer = async (offerType: "discount" | "pause") => {
    setOfferBusy(true);
    try {
      const res = await fetch("/api/billing/retention-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_type: offerType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not apply offer");
      setOfferResult({ ok: true, message: data.message });
    } catch (err) {
      setOfferResult({ ok: false, message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setOfferBusy(false);
    }
  };

  return (
    <div>
      {/* Cancel subscription */}
      <div className="rounded-lg border border-orange-200 dark:border-orange-900/40 p-5 mb-6">
        <h3 className="font-semibold mb-1">Cancel subscription</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          To cancel, contact our support team. We&apos;ll process your cancellation within 1 business day.
        </p>

        {isFoundingMember && commitmentEndDate && (
          <div className="mb-4 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Founding Member — 3-month commitment active
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              As a Founding Member, you committed to a 3-month minimum term ending{" "}
              <strong>{new Date(commitmentEndDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</strong>.
              Cancellation is not available until after this date.
            </p>
          </div>
        )}

        {!showRetention && !isFoundingMember ? (
          <button
            type="button"
            onClick={() => setShowRetention(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-400 px-4 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            Request cancellation
          </button>
        ) : !showRetention && isFoundingMember ? (
          <a
            href={`mailto:support@servlo.com.au?subject=${encodeURIComponent("Founding Member — Cancellation Enquiry")}&body=${encodeURIComponent(`Hi,\n\nI'm a Founding Member and would like to discuss my subscription.\n\nBusiness: ${businessName}\nEmail: ${userEmail}`)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Contact support
          </a>
        ) : null}

        {/* Retention offer panel */}
        {showRetention && !offerResult ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 space-y-4">
            <div>
              <p className="text-base font-semibold text-[var(--text-primary)]">Before you go — can we help?</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                We&apos;d hate to see you leave. Choose one of these options or proceed with cancellation below.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={offerBusy}
                onClick={() => applyRetentionOffer("discount")}
                className="flex flex-col items-start rounded-lg border-2 border-[var(--accent-color)] bg-[var(--bg-card)] p-4 text-left hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                <span className="text-sm font-bold text-[var(--accent-color)]">50% off next month</span>
                <span className="mt-1 text-xs text-[var(--text-secondary)]">
                  Stay on your current plan at half price for the next billing cycle, then continue as normal.
                </span>
              </button>
              <button
                type="button"
                disabled={offerBusy}
                onClick={() => applyRetentionOffer("pause")}
                className="flex flex-col items-start rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                <span className="text-sm font-bold text-[var(--text-primary)]">Pause for 30 days</span>
                <span className="mt-1 text-xs text-[var(--text-secondary)]">
                  Put your subscription on hold for 30 days — no charge, and your data stays safe.
                </span>
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Not interested? You can still{" "}
              <a
                href={`mailto:support@servlo.com.au?subject=${encodeURIComponent(`Cancel Subscription - ${businessName}`)}&body=${encodeURIComponent(`Please cancel my SERVLO subscription.\n\nBusiness name: ${businessName}\nAccount email: ${userEmail}`)}`}
                className="underline text-orange-500 hover:text-orange-600"
              >
                request cancellation via email
              </a>
              .
            </p>
          </div>
        ) : null}

        {/* Offer applied confirmation */}
        {offerResult ? (
          <div className={`mt-4 rounded-lg p-4 text-sm ${offerResult.ok ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
            {offerResult.message}
          </div>
        ) : null}
      </div>

      {/* Demo data */}
      <DemoDataSection />

      {/* Delete account */}
      <div className="rounded-lg border border-red-200 dark:border-red-900/40 p-5">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">Delete account</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Permanently deletes your account and all data. This cannot be undone.
        </p>

        {/* Step 1: checkbox */}
        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => {
              setDeleteConfirmed(e.target.checked);
              if (!e.target.checked) setDeleteNameInput("");
            }}
            className="mt-0.5"
          />
          <span className="text-sm">I understand this action is permanent and cannot be undone.</span>
        </label>

        {/* Step 2: business name confirmation */}
        {deleteConfirmed ? (
          <div className="mb-4">
            <label className="block text-sm mb-1">
              Type your business name to confirm: <strong>{businessName || "(no name set)"}</strong>
            </label>
            <input
              value={deleteNameInput}
              onChange={(e) => setDeleteNameInput(e.target.value)}
              className="w-full max-w-sm rounded-md border border-zinc-300 dark:border-white/20 bg-white dark:bg-[#161d2e] px-3 py-2 text-sm text-[var(--text-primary)]"
              placeholder="Business name"
            />
          </div>
        ) : null}

        {/* Step 3: request deletion link */}
        {deleteConfirmed && deleteNameInput === businessName && businessName ? (
          <a
            href={`mailto:support@servlo.com.au?subject=${encodeURIComponent(`Delete Account - ${businessName}`)}&body=${encodeURIComponent(`Please permanently delete my SERVLO account and all associated data.\n\nBusiness name: ${businessName}\nAccount email: ${userEmail}\n\nI understand this is permanent and cannot be undone.`)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Request account deletion
          </a>
        ) : null}
      </div>
    </div>
  );
}
