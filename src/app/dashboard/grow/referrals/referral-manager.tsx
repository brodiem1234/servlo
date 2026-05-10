"use client";

import { useState } from "react";
import { Users, Copy, Check, QrCode, Plus, X, ChevronDown } from "lucide-react";

type Referral = {
  id: string;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  status: string;
  reward_type: string | null;
  reward_amount: number | null;
  referral_code: string | null;
  created_at: string;
};

type Stats = {
  totalReferrals: number;
  convertedCount: number;
  pendingCount: number;
  totalRewardsValue: number;
};

type Toast = { id: number; message: string; type: "success" | "error" };

function shortId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B", label: "Pending" },
    converted: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6", label: "Converted" },
    rewarded: { bg: "rgba(16,185,129,0.15)", text: "#10B981", label: "Rewarded" },
    expired: { bg: "rgba(107,114,128,0.15)", text: "#6B7280", label: "Expired" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function AddReferralModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (r: Referral) => void;
}) {
  const [form, setForm] = useState({
    referred_name: "",
    referred_email: "",
    referred_phone: "",
    reward_type: "discount",
    reward_amount: "",
    referral_code: shortId(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.referred_name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/grow/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          reward_amount: form.reward_amount ? Number(form.reward_amount) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add referral");
      onAdd(json.referral);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Add Referral
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {[
            { label: "Referred Name *", key: "referred_name", type: "text", placeholder: "Jane Smith" },
            { label: "Email", key: "referred_email", type: "email", placeholder: "jane@example.com" },
            { label: "Phone", key: "referred_phone", type: "tel", placeholder: "04XX XXX XXX" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                {field.label}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 transition"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Reward Type
              </label>
              <select
                value={form.reward_type}
                onChange={(e) => setForm((f) => ({ ...f, reward_type: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="discount">Discount</option>
                <option value="credit">Credit</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Reward Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                value={form.reward_amount}
                onChange={(e) => setForm((f) => ({ ...f, reward_amount: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Referral Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.referral_code}
                onChange={(e) => setForm((f) => ({ ...f, referral_code: e.target.value }))}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono outline-none"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, referral_code: shortId() }))}
                className="rounded-lg border px-3 py-2 text-xs font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Regenerate
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#8B5CF6" }}
            >
              {saving ? "Adding..." : "Add Referral"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReferralManager({
  referrals: initialReferrals,
  stats,
  referralUrl: propReferralUrl,
}: {
  referrals: Referral[];
  stats: Stats;
  referralUrl?: string;
}) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const referralUrl = propReferralUrl ?? "https://servlo.com.au/ref/YOUR-CODE";

  function addToast(message: string, type: "success" | "error") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function copyUrl() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function patchStatus(id: string, patch: Record<string, any>) {
    const res = await fetch(`/api/grow/referrals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      addToast("Failed to update referral.", "error");
      return false;
    }
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    return true;
  }

  async function markConverted(id: string) {
    const ok = await patchStatus(id, { status: "converted" });
    if (ok) addToast("Referral marked as converted.", "success");
  }

  async function markRewarded(id: string) {
    const ok = await patchStatus(id, {
      status: "rewarded",
      reward_paid_at: new Date().toISOString(),
    });
    if (ok) addToast("Referral marked as rewarded.", "success");
  }

  function handleAdd(referral: Referral) {
    setReferrals((prev) => [referral, ...prev]);
    addToast("Referral added successfully.", "success");
  }

  const statCards = [
    { label: "Total Referrals", value: stats.totalReferrals },
    { label: "Converted", value: stats.convertedCount, accent: "#3B82F6" },
    { label: "Pending", value: stats.pendingCount, accent: "#F59E0B" },
    {
      label: "Total Rewards Paid",
      value: `$${stats.totalRewardsValue.toFixed(2)}`,
      accent: "#10B981",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Referral Programme
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Track and reward customers who refer new business
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: "#8B5CF6" }}
        >
          <Plus size={16} />
          Add Referral
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: card.accent ?? "var(--text-primary)" }}
            >
              {card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Referral link section */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Your Referral Link
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono truncate"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
            }}
          >
            {referralUrl}
          </div>
          <button
            onClick={copyUrl}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: copied ? "#10B981" : "var(--text-secondary)" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* QR code placeholder */}
        <div className="flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#8B5CF6" }}
          >
            <QrCode size={36} className="text-white opacity-80" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              QR Code
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Share this QR code with customers to make referrals easy.
            </p>
            <button
              disabled
              title="Coming soon"
              className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-medium opacity-40 cursor-not-allowed"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Download QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Referrals table */}
      {referrals.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
        >
          <Users size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            No referrals yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Share your referral link to start earning referrals.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-x-auto"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {["Name", "Contact", "Status", "Reward", "Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: i < referrals.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {r.referred_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    <div>{r.referred_email ?? "—"}</div>
                    {r.referred_phone && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {r.referred_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {r.reward_amount ? (
                      <span>
                        ${Number(r.reward_amount).toFixed(2)}{" "}
                        <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                          ({r.reward_type})
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.created_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.status === "pending" && (
                        <button
                          onClick={() => markConverted(r.id)}
                          className="rounded-lg border px-2 py-1 text-xs font-medium transition hover:opacity-80"
                          style={{ borderColor: "rgba(59,130,246,0.4)", color: "#3B82F6" }}
                        >
                          Mark Converted
                        </button>
                      )}
                      {(r.status === "converted" || r.status === "pending") && (
                        <button
                          onClick={() => markRewarded(r.id)}
                          className="rounded-lg border px-2 py-1 text-xs font-medium transition hover:opacity-80"
                          style={{ borderColor: "rgba(16,185,129,0.4)", color: "#10B981" }}
                        >
                          Mark Rewarded
                        </button>
                      )}
                      {r.status === "rewarded" && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <AddReferralModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto"
            style={{
              backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
              color: "#fff",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
