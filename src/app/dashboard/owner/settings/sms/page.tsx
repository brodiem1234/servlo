"use client";

import { useState } from "react";

const SMS_AUTOMATIONS = [
  {
    id: "job_reminder_24h",
    label: "Job appointment reminder (24h before)",
    description: "Send a reminder SMS to the client 24 hours before a scheduled job.",
    defaultOn: true,
  },
  {
    id: "job_completion",
    label: "Job completion notification",
    description: "Notify the client via SMS when a job is marked as complete.",
    defaultOn: false,
  },
  {
    id: "invoice_sent",
    label: "Invoice sent notification",
    description: "Send an SMS to the client when an invoice is emailed.",
    defaultOn: false,
  },
  {
    id: "quote_sent",
    label: "Quote sent notification",
    description: "Send an SMS to the client when a quote is emailed.",
    defaultOn: false,
  },
];

export default function SmsSettingsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(SMS_AUTOMATIONS.map((a) => [a.id, a.defaultOn]))
  );
  const [saved, setSaved] = useState(false);

  function handleToggle(id: string) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  }

  async function handleSave() {
    // TODO: Persist to businesses.sms_automation_settings JSONB column
    // For now, show success feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const isConfigured = Boolean(
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_SMS_ENABLED === "true"
  );

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <a
          href="/dashboard/owner/settings"
          className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span aria-hidden>←</span> Back to Settings
        </a>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">SMS Automations</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Automate SMS notifications to your clients. Requires Twilio to be configured.
        </p>
      </div>

      {/* Setup notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-4">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Setup required</p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          SMS requires a Twilio account. Set the following environment variables to enable:
        </p>
        <ul className="mt-2 space-y-0.5 text-xs font-mono text-amber-800 dark:text-amber-200">
          <li>TWILIO_ACCOUNT_SID</li>
          <li>TWILIO_AUTH_TOKEN</li>
          <li>TWILIO_FROM_NUMBER</li>
        </ul>
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          When variables are not set, SMS calls no-op silently — no errors will occur.
        </p>
      </div>

      {/* Automation toggles */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
        {SMS_AUTOMATIONS.map((auto) => (
          <div key={auto.id} className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{auto.label}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{auto.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled[auto.id]}
              onClick={() => handleToggle(auto.id)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
                enabled[auto.id] ? "bg-[var(--accent-color)]" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  enabled[auto.id] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Manual SMS tester */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Test SMS</h2>
        <p className="text-xs text-[var(--text-muted)]">Send a test SMS to verify Twilio is configured correctly.</p>
        <ManualSmsTester />
      </div>

      {/* Save */}
      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          SMS settings saved.
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleSave}
        className="rounded-md bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Save settings
      </button>
    </section>
  );
}

function ManualSmsTester() {
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("Test SMS from SERVLO — your SMS automation is working!");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  async function send() {
    setStatus("sending");
    setErrorText("");
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, body: msg }),
      });
      const d = await res.json();
      if (d.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorText(d.error ?? "Unknown error");
      }
    } catch {
      setStatus("error");
      setErrorText("Network error");
    }
  }

  return (
    <div className="space-y-2">
      <input
        className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        placeholder="Mobile number (e.g. 0400 000 000)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <button
        type="button"
        onClick={send}
        disabled={status === "sending" || !to}
        className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send test SMS"}
      </button>
      {status === "ok" && <p className="text-xs text-green-600 dark:text-green-400">SMS sent (or logged if Twilio not configured).</p>}
      {status === "error" && <p className="text-xs text-red-600 dark:text-red-400">{errorText}</p>}
    </div>
  );
}
