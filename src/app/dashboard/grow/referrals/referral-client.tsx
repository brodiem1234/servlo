"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Copy,
  CheckCheck,
  Mail,
  MessageSquare,
  Users2,
  DollarSign,
  Clock,
  Award,
  Download,
  QrCode,
  UserPlus,
  X,
  Send,
} from "lucide-react";
import QRCode from "qrcode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Referral {
  id: string;
  referred_email: string | null;
  referred_name?: string | null;
  status: string;
  reward_amount: number;
  created_at: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  pending: { background: "rgb(245 158 11 / 0.15)", color: "#F59E0B" },
  signed_up: { background: "rgb(59 130 246 / 0.15)", color: "#60A5FA" },
  subscribed: { background: "rgb(16 185 129 / 0.15)", color: "#10B981" },
  rewarded: { background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  signed_up: "Signed Up",
  subscribed: "Subscribed",
  rewarded: "Rewarded",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={STATUS_STYLES[status] ?? STATUS_STYLES.pending}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Refer-a-Business Modal ───────────────────────────────────────────────────

function ReferBusinessModal({
  onClose,
  businessName,
  referralCode,
  onSent,
}: {
  onClose: () => void;
  businessName: string;
  referralCode: string;
  onSent: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/grow/send-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referredName: name.trim() || undefined,
          referredEmail: email.trim(),
          businessName,
          referralCode,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to send. Try again.");
      } else {
        setSent(true);
        onSent();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (!modalRef.current?.contains(e.target as Node)) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl dark:bg-[#1a2235]"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Refer a Business
          </h2>
          <button type="button" onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCheck size={36} style={{ color: "#10B981" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Invite sent!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {name.trim() || email} will receive an email with your referral link and a 30-day free trial offer.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg px-5 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Know a tradie or service business that could benefit from SERVLO? Invite them and earn $50 when they subscribe.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Their name <span style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mike Johnson"
                className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-[#161d2e]"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Their email address <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. mike@tradesco.com.au"
                className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-[#161d2e]"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!email.trim() || sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: "#8B5CF6" }}
            >
              {sending ? <><Spinner /> Sending invite…</> : <><Send size={14} /> Send invite</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function ReferralClient({
  referralCode,
  referrals: initialReferrals,
  businessName,
}: {
  referralCode: string;
  referrals: Referral[];
  businessName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showReferModal, setShowReferModal] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [chasingId, setChasingId] = useState<string | null>(null);
  const [chasedIds, setChasedIds] = useState<Set<string>>(new Set());

  const referralLink = `https://servlo.com.au/ref/${referralCode}`;

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(
      referralLink,
      { width: 200, margin: 2, color: { dark: "#8B5CF6", light: "#ffffff" } },
      (err, url) => {
        if (!err) setQrDataUrl(url);
      }
    );
  }, [referralLink]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `servlo-referral-${referralCode}.png`;
    a.click();
  };

  const handleChaseUp = async (referral: Referral) => {
    if (!referral.referred_email) return;
    setChasingId(referral.id);
    try {
      await fetch("/api/grow/chase-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralId: referral.id,
          referredEmail: referral.referred_email,
          referredName: referral.referred_name ?? undefined,
          businessName,
          referralCode,
        }),
      });
      setChasedIds((prev) => new Set([...prev, referral.id]));
    } catch {
      // Silent fail
    } finally {
      setChasingId(null);
    }
  };

  const mailtoHref = `mailto:?subject=Join SERVLO — business management software for tradies&body=Hey, I'm using SERVLO to run my trade business and thought you might find it useful too. Sign up with my referral link: ${referralLink}`;
  const smsHref = `sms:?body=Check out SERVLO for managing your trade business: ${referralLink}`;

  // Stats
  const totalReferrals = referrals.length;
  const converted = referrals.filter((r) => ["subscribed", "rewarded"].includes(r.status)).length;
  const rewardsEarned = referrals.filter((r) => r.status === "rewarded").reduce((sum, r) => sum + Number(r.reward_amount ?? 0), 0);
  const pendingRewards = referrals.filter((r) => r.status === "subscribed").reduce((sum, r) => sum + Number(r.reward_amount ?? 0), 0);

  const STATS = [
    { label: "Total Referrals", value: totalReferrals, Icon: Users2 },
    { label: "Converted", value: converted, Icon: CheckCheck },
    { label: "Rewards Earned", value: `$${rewardsEarned.toFixed(0)}`, Icon: DollarSign },
    { label: "Pending Rewards", value: `$${pendingRewards.toFixed(0)}`, Icon: Clock },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Referral Tracking
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Earn $50 for every business that subscribes via your link.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReferModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#8B5CF6" }}
          >
            <UserPlus size={14} /> Refer a business
          </button>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
            style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
          >
            Coming soon
          </span>
        </div>
      </div>

      {/* Referral link box + QR code */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Link section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "rgb(139 92 246 / 0.15)" }}
              >
                <Users2 size={17} style={{ color: "#8B5CF6" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Your referral link</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{businessName}</p>
              </div>
            </div>

            {/* Link row */}
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <p className="flex-1 truncate font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                {referralLink}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: copied ? "rgb(16 185 129 / 0.15)" : "rgb(139 92 246 / 0.15)",
                  borderColor: copied ? "#10B981" : "rgb(139 92 246 / 0.4)",
                  color: copied ? "#10B981" : "#A78BFA",
                }}
              >
                {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>

            {/* Share buttons */}
            <div className="flex flex-wrap gap-2">
              <a
                href={mailtoHref}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
              >
                <Mail size={12} /> Share via Email
              </a>
              <a
                href={smsHref}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
              >
                <MessageSquare size={12} /> Share via SMS
              </a>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 self-start">
              <QrCode size={14} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>QR Code</span>
            </div>
            {qrDataUrl ? (
              <div
                className="rounded-xl border p-2"
                style={{ background: "#ffffff", borderColor: "var(--border)" }}
              >
                <img src={qrDataUrl} alt="Referral QR code" width={160} height={160} />
              </div>
            ) : (
              <div
                className="flex h-[176px] w-[176px] items-center justify-center rounded-xl border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              >
                <Spinner />
              </div>
            )}
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
            >
              <Download size={12} /> Download QR code
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "rgb(139 92 246 / 0.15)" }}
              >
                <Icon size={13} style={{ color: "#8B5CF6" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Referrals table */}
      <div className="rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Your Referrals
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{referrals.length} total</span>
        </div>

        {referrals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgb(139 92 246 / 0.12)" }}
            >
              <Users2 size={26} style={{ color: "#8B5CF6" }} />
            </span>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No referrals yet</p>
            <p className="max-w-xs text-xs" style={{ color: "var(--text-muted)" }}>
              Share your link to start earning! You get $50 for every business that subscribes via your referral link.
            </p>
            <button
              type="button"
              onClick={() => setShowReferModal(true)}
              className="mt-1 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              <UserPlus size={14} /> Refer your first business
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs font-semibold uppercase"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Reward</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                      <p>{r.referred_email ?? "—"}</p>
                      {r.referred_name && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.referred_name}</p>
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
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: r.status === "rewarded" ? "#10B981" : "var(--text-muted)" }}>
                      {r.status === "rewarded"
                        ? `$${Number(r.reward_amount).toFixed(0)}`
                        : r.status === "subscribed"
                        ? `$${Number(r.reward_amount).toFixed(0)} pending`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" && r.referred_email && (
                        <button
                          type="button"
                          onClick={() => void handleChaseUp(r)}
                          disabled={chasingId === r.id || chasedIds.has(r.id)}
                          className="flex items-center gap-1.5 ml-auto rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50"
                          style={{
                            borderColor: chasedIds.has(r.id) ? "#10B981" : "var(--border)",
                            color: chasedIds.has(r.id) ? "#10B981" : "var(--text-secondary)",
                            background: chasedIds.has(r.id) ? "rgb(16 185 129 / 0.12)" : "var(--bg-secondary)",
                          }}
                        >
                          {chasingId === r.id ? (
                            <><Spinner /> Sending…</>
                          ) : chasedIds.has(r.id) ? (
                            <><CheckCheck size={11} /> Chased up</>
                          ) : (
                            <><Mail size={11} /> Chase up</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reward settings box */}
      <div
        className="rounded-xl border p-5 space-y-3"
        style={{ background: "rgb(139 92 246 / 0.06)", borderColor: "rgb(139 92 246 / 0.3)" }}
      >
        <div className="flex items-center gap-2">
          <Award size={18} style={{ color: "#8B5CF6" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Reward settings</h3>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Reward per successful referral</span>
            <span className="font-bold" style={{ color: "#A78BFA" }}>$50 AUD</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Reward trigger</span>
            <span style={{ color: "var(--text-secondary)" }}>When referred person subscribes</span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <span style={{ color: "var(--text-muted)" }}>Reward method</span>
            <span className="text-right" style={{ color: "var(--text-secondary)" }}>
              Bank transfer{" "}
              <a href="/dashboard/owner/settings" className="text-xs font-semibold" style={{ color: "#8B5CF6" }}>
                (configure in Settings)
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Refer-a-business modal */}
      {showReferModal && (
        <ReferBusinessModal
          onClose={() => setShowReferModal(false)}
          businessName={businessName}
          referralCode={referralCode}
          onSent={() => {
            // Reload referrals optimistically by re-fetching (page will revalidate on nav)
            setReferrals((prev) => prev);
          }}
        />
      )}
    </section>
  );
}
