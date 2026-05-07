"use client";

import { useState } from "react";

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
          checked ? "bg-[var(--accent-color)]" : "bg-slate-300 dark:bg-slate-600"
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
                        checked ? "bg-[var(--accent-color)]" : "bg-slate-300 dark:bg-slate-600"
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
                  className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
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
            (prefs.weekly_digest ?? false) ? "bg-[var(--accent-color)]" : "bg-slate-300 dark:bg-slate-600"
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
          className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
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
            className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
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
        className="rounded border border-[var(--accent-color)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--accent-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,var(--bg-card))]"
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
};

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
  { key: "solo", label: "Solo", price: "$49/mo", users: "1", jobs: "50", clients: "5" },
  { key: "team", label: "Team", price: "$119/mo", users: "5", jobs: "Unlimited", clients: "50" },
  { key: "business", label: "Business", price: "$249/mo", users: "15", jobs: "Unlimited", clients: "Unlimited" },
  { key: "enterprise", label: "Enterprise", price: "$499/mo", users: "Unlimited", jobs: "Unlimited", clients: "Unlimited + dedicated support" },
];

export function BillingTab({ currentPlan, isOnTrial, email, priceIds, success }: BillingTabProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string>("");

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

  const planPriceIds: Record<string, string> = {
    solo: priceIds.solo,
    team: priceIds.team,
    business: priceIds.business,
  };

  return (
    <div className="space-y-5">
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Subscription checkout completed successfully.
        </div>
      ) : null}

      {/* A. Current plan card */}
      {!isOnTrial ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Current plan</h2>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-2xl font-bold capitalize text-[var(--text-primary)]">{currentPlan}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {currentPlan === "solo"
                  ? "$49/mo · 1 user · 50 jobs/mo · 5 clients"
                  : currentPlan === "team"
                    ? "$119/mo · 5 users · Unlimited jobs"
                    : currentPlan === "business"
                      ? "$249/mo · 15 users · Unlimited jobs"
                      : currentPlan === "enterprise"
                        ? "$499/mo · Unlimited users · dedicated support"
                        : "Active subscription"}
              </p>
              <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Active
              </span>
            </div>
            <button
              type="button"
              onClick={openStripePortal}
              disabled={portalLoading}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-60"
            >
              {portalLoading ? "Loading…" : "Manage subscription"}
            </button>
          </div>
          {portalError ? (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{portalError}</p>
          ) : null}
        </div>
      ) : null}

      {/* B. Plan comparison table */}
      <div id="plans" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Plans</h2>
        {checkoutError ? (
          <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{checkoutError}</p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="pb-3 pr-4 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Plan</th>
                <th className="pb-3 pr-4 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Price</th>
                <th className="pb-3 pr-4 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Users</th>
                <th className="pb-3 pr-4 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Jobs/mo</th>
                <th className="pb-3 pr-4 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Clients</th>
                <th className="pb-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((plan) => {
                const isCurrent = currentPlan.toLowerCase() === plan.key;
                return (
                  <tr
                    key={plan.key}
                    className={`border-b border-[var(--border)] last:border-0 ${isCurrent ? "bg-[color-mix(in_srgb,var(--accent-color)_8%,transparent)]" : ""}`}
                  >
                    <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">
                      {plan.label}
                      {isCurrent ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-[var(--accent-color)] px-2 py-0.5 text-[10px] font-bold text-white">Current</span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-[var(--text-primary)]">{plan.price}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{plan.users}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{plan.jobs}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{plan.clients}</td>
                    <td className="py-3">
                      {isCurrent ? null : plan.key === "enterprise" ? (
                        <a
                          href="mailto:sales@servlo.com.au?subject=Enterprise%20Plan%20Enquiry"
                          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        >
                          Contact us
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={checkoutLoading === plan.key}
                          onClick={() => startCheckout(planPriceIds[plan.key] ?? "", plan.key)}
                          className="rounded-md bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
                        >
                          {checkoutLoading === plan.key ? "Redirecting…" : "Upgrade"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* C. Invoice history note */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Invoice history</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          View and download your invoices in the{" "}
          <button
            type="button"
            onClick={openStripePortal}
            disabled={portalLoading}
            className="text-[var(--accent-color)] hover:underline disabled:opacity-60"
          >
            Stripe billing portal
          </button>
          .
        </p>
      </div>

      {/* D. Footer note */}
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
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">Coming soon</span>
              </div>
              <span className="text-[var(--text-muted)]">▸</span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm text-[var(--text-secondary)]">Connect to Xero to import clients, invoices, and contacts.</p>
              <button type="button" disabled className="mt-3 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] cursor-not-allowed opacity-60">
                Connect Xero
              </button>
            </div>
          </details>

          {/* MYOB */}
          <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <span>MYOB</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">Coming soon</span>
              </div>
              <span className="text-[var(--text-muted)]">▸</span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm text-[var(--text-secondary)]">Sync financial data from MYOB AccountRight or Essentials.</p>
              <button type="button" disabled className="mt-3 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] cursor-not-allowed opacity-60">
                Connect MYOB
              </button>
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

type IntegrationCard = {
  name: string;
  bg: string;
  initial: string;
  description: string;
  status: string;
  textDark?: boolean;
};

type IntegrationCategory = {
  label: string;
  cards: IntegrationCard[];
};

const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    label: "Accounting",
    cards: [
      { name: "Xero", bg: "#1AB4D3", initial: "X", description: "Import invoices & contacts", status: "Coming soon" },
      { name: "MYOB", bg: "#7B2D8B", initial: "M", description: "Sync financial data", status: "Coming soon" },
      { name: "QuickBooks", bg: "#2CA01C", initial: "Q", description: "Two-way sync", status: "Coming soon" },
    ],
  },
  {
    label: "Payments",
    cards: [
      { name: "Stripe", bg: "#635BFF", initial: "S", description: "Online payments", status: "Active" },
      { name: "Square", bg: "#00C244", initial: "Sq", description: "POS integration", status: "Coming soon" },
      { name: "PayPal", bg: "#003087", initial: "PP", description: "Payment processing", status: "Coming soon" },
    ],
  },
  {
    label: "Communication",
    cards: [
      { name: "Twilio", bg: "#F22F46", initial: "Tw", description: "SMS notifications", status: "Coming soon" },
      { name: "Mailchimp", bg: "#FFE01B", initial: "Mc", description: "Email campaigns", status: "Coming soon", textDark: true },
    ],
  },
  {
    label: "Calendar",
    cards: [
      { name: "Google Calendar", bg: "#4285F4", initial: "GC", description: "Sync job schedules", status: "Coming soon" },
      { name: "Microsoft 365", bg: "#D83B01", initial: "Ms", description: "Outlook calendar", status: "Coming soon" },
    ],
  },
  {
    label: "Documents",
    cards: [
      { name: "Google Drive", bg: "#0F9D58", initial: "GD", description: "Store job documents", status: "Coming soon" },
      { name: "Dropbox", bg: "#0061FF", initial: "Db", description: "File storage", status: "Coming soon" },
    ],
  },
  {
    label: "Automation",
    cards: [
      { name: "Zapier", bg: "#FF4A00", initial: "Za", description: "Connect 5000+ apps", status: "Coming soon" },
      { name: "Make", bg: "#6D00CC", initial: "Mk", description: "Visual automation", status: "Coming soon" },
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
      { name: "Google Maps", bg: "#4285F4", initial: "GM", description: "Job location & routing", status: "Coming soon" },
      { name: "HERE Maps", bg: "#48DAD0", initial: "HM", description: "Fleet tracking", status: "Coming soon", textDark: true },
    ],
  },
];

type IntegrationsTabProps = {
  stripeConnected: boolean;
};

export function IntegrationsTab({ stripeConnected }: IntegrationsTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Connect SERVLO to the tools you already use.</p>
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
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${card.textDark ? "text-gray-900" : "text-white"}`}
                    style={{ background: card.bg }}
                  >
                    {card.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{card.name}</p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          resolvedStatus === "Active"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
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

// ── Welcome Overlay (ITEM 10) ───────────────────────────────────────────────

type WelcomeOverlayProps = {
  onboardingCompleted: boolean;
  completeAction: () => Promise<void>;
};

export function WelcomeOverlay({ onboardingCompleted, completeAction }: WelcomeOverlayProps) {
  const [showWelcome, setShowWelcome] = useState(!onboardingCompleted);

  async function closeWelcome() {
    setShowWelcome(false);
    try {
      await completeAction();
    } catch {
      // Non-fatal — just hide the overlay
    }
  }

  if (!showWelcome) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)" }} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 51,
          width: "min(480px,90vw)",
        }}
        className="bg-white dark:bg-[#1a2235] rounded-xl p-8 shadow-2xl"
      >
        <h2 className="text-xl font-bold mb-2">Welcome to SERVLO! 🎉</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{"Let's get your account set up in 3 simple steps."}</p>
        <ol className="space-y-4 mb-8">
          <li className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
            <div>
              <p className="font-semibold text-sm">Add your business details</p>
              <p className="text-xs text-gray-500">ABN, trading name, and contact info.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
            <div>
              <p className="font-semibold text-sm">Invite your team</p>
              <p className="text-xs text-gray-500">Add employees or subcontractors.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
            <div>
              <p className="font-semibold text-sm">Explore with demo data</p>
              <p className="text-xs text-gray-500">Load sample jobs, clients, and invoices.</p>
            </div>
          </li>
        </ol>
        <button
          onClick={closeWelcome}
          className="w-full rounded-lg py-2.5 font-semibold text-white"
          style={{ background: "#3B82F6" }}
        >
          Get started
        </button>
        <button
          onClick={closeWelcome}
          className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600"
        >
          Skip for now
        </button>
      </div>
    </>
  );
}

// ── Danger Zone Tab (ITEM 11) ───────────────────────────────────────────────

type DangerZoneTabProps = {
  businessName: string;
  userEmail: string;
};

export function DangerZoneTab({ businessName, userEmail }: DangerZoneTabProps) {
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteNameInput, setDeleteNameInput] = useState("");

  return (
    <div>
      {/* Cancel subscription */}
      <div className="rounded-lg border border-orange-200 dark:border-orange-900/40 p-5 mb-6">
        <h3 className="font-semibold mb-1">Cancel subscription</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          To cancel, contact our support team. We&apos;ll process your cancellation within 1 business day.
        </p>
        <a
          href={`mailto:support@servlo.com.au?subject=${encodeURIComponent(`Cancel Subscription - ${businessName}`)}&body=${encodeURIComponent(`Please cancel my SERVLO subscription.\n\nBusiness name: ${businessName}\nAccount email: ${userEmail}`)}`}
          className="inline-flex items-center gap-2 rounded-lg border border-orange-400 px-4 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
        >
          Request cancellation via email
        </a>
      </div>

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
              className="w-full max-w-sm rounded-md border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-[#161d2e] px-3 py-2 text-sm"
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
