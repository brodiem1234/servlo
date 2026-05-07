"use client";

import React, { useState } from "react";
import { Copy, CheckCheck, Mail, MessageSquare, Users2, DollarSign, Clock, Award } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Referral {
  id: string;
  referred_email: string | null;
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

// ─── Main client component ────────────────────────────────────────────────────

export default function ReferralClient({
  referralCode,
  referrals,
  businessName,
}: {
  referralCode: string;
  referrals: Referral[];
  businessName: string;
}) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://servlo.com.au/ref/${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const mailtoHref = `mailto:?subject=Join SERVLO — business management software for tradies&body=Hey, I'm using SERVLO to run my trade business and thought you might find it useful too. Sign up with my referral link: ${referralLink}`;
  const smsHref = `sms:?body=Check out SERVLO for managing your trade business: ${referralLink}`;

  // Stats
  const totalReferrals = referrals.length;
  const converted = referrals.filter((r) =>
    ["subscribed", "rewarded"].includes(r.status)
  ).length;
  const rewardsEarned = referrals
    .filter((r) => r.status === "rewarded")
    .reduce((sum, r) => sum + Number(r.reward_amount ?? 0), 0);
  const pendingRewards = referrals
    .filter((r) => r.status === "subscribed")
    .reduce((sum, r) => sum + Number(r.reward_amount ?? 0), 0);

  const STATS = [
    { label: "Total Referrals", value: totalReferrals, Icon: Users2 },
    { label: "Converted", value: converted, Icon: CheckCheck },
    {
      label: "Rewards Earned",
      value: `$${rewardsEarned.toFixed(0)}`,
      Icon: DollarSign,
    },
    {
      label: "Pending Rewards",
      value: `$${pendingRewards.toFixed(0)}`,
      Icon: Clock,
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Referral Tracking
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Earn $50 for every business that subscribes via your link.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
        >
          Coming soon
        </span>
      </div>

      {/* Referral link box */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "rgb(139 92 246 / 0.15)" }}
          >
            <Users2 size={17} style={{ color: "#8B5CF6" }} />
          </div>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Your referral link
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {businessName}
            </p>
          </div>
        </div>

        {/* Link row */}
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <p
            className="flex-1 truncate font-mono text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {referralLink}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: copied
                ? "rgb(16 185 129 / 0.15)"
                : "rgb(139 92 246 / 0.15)",
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
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
            }}
          >
            <Mail size={12} /> Share via Email
          </a>
          <a
            href={smsHref}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
            }}
          >
            <MessageSquare size={12} /> Share via SMS
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "rgb(139 92 246 / 0.15)" }}
              >
                <Icon size={13} style={{ color: "#8B5CF6" }} />
              </span>
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Referrals table */}
      <div
        className="rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Your Referrals
          </h2>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {referrals.length} total
          </span>
        </div>

        {referrals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgb(139 92 246 / 0.12)" }}
            >
              <Users2 size={26} style={{ color: "#8B5CF6" }} />
            </span>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              No referrals yet
            </p>
            <p className="max-w-xs text-xs" style={{ color: "var(--text-muted)" }}>
              Share your link to start earning! You get $50 for every business
              that subscribes via your referral link.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs font-semibold uppercase"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.referred_email ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(r.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-right font-semibold tabular-nums"
                      style={{
                        color:
                          r.status === "rewarded"
                            ? "#10B981"
                            : "var(--text-muted)",
                      }}
                    >
                      {r.status === "rewarded"
                        ? `$${Number(r.reward_amount).toFixed(0)}`
                        : r.status === "subscribed"
                        ? `$${Number(r.reward_amount).toFixed(0)} pending`
                        : "—"}
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
        style={{
          background: "rgb(139 92 246 / 0.06)",
          borderColor: "rgb(139 92 246 / 0.3)",
        }}
      >
        <div className="flex items-center gap-2">
          <Award size={18} style={{ color: "#8B5CF6" }} />
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Reward settings
          </h3>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Reward per successful referral</span>
            <span
              className="font-bold"
              style={{ color: "#A78BFA" }}
            >
              $50 AUD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Reward trigger</span>
            <span style={{ color: "var(--text-secondary)" }}>
              When referred person subscribes
            </span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <span style={{ color: "var(--text-muted)" }}>Reward method</span>
            <span className="text-right" style={{ color: "var(--text-secondary)" }}>
              Bank transfer{" "}
              <a
                href="/dashboard/owner/settings"
                className="text-xs font-semibold"
                style={{ color: "#8B5CF6" }}
              >
                (configure in Settings)
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
