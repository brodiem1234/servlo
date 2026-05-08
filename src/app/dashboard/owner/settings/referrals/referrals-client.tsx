"use client";

import { useState } from "react";
import { Copy, Check, Gift, Users } from "lucide-react";

type ReferralStat = {
  referred_email: string;
  status: string;
  created_at: string;
};

type Props = {
  code: string;
  referralUrl: string;
  stats: ReferralStat[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200" },
  signed_up: { label: "Signed Up", color: "text-blue-600 bg-blue-50 border-blue-200" },
  subscribed: { label: "Subscribed", color: "text-green-600 bg-green-50 border-green-200" },
};

export function ReferralsClient({ code, referralUrl, stats }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const subscribedCount = stats.filter((s) => s.status === "subscribed").length;
  const totalCount = stats.length;

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Refer & Earn</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Share your unique link. When someone subscribes, you both get $20 account credit.
        </p>
      </div>

      {/* Reward info box */}
      <div className="rounded-xl border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/5 p-5 flex items-start gap-4">
        <Gift className="mt-0.5 shrink-0 text-[var(--accent-color)]" size={24} />
        <div>
          <p className="font-semibold text-[var(--text-primary)]">$20 credit for you and your referral</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            When someone you refer subscribes to any SERVLO plan, you both receive $20 account credit applied automatically to your next invoice.
          </p>
        </div>
      </div>

      {/* Referral link card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">Your referral link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] truncate">
            {referralUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Your code: <span className="font-mono font-bold text-[var(--text-primary)]">{code}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-[var(--text-muted)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Total referred</p>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={16} className="text-[var(--text-muted)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Subscribed</p>
          </div>
          <p className="text-3xl font-bold text-green-500">{subscribedCount}</p>
        </div>
      </div>

      {/* Referral history table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Referral history</p>
        </div>
        {stats.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[var(--text-muted)]">No referrals yet. Share your link to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {stats.map((s, i) => {
              const statusInfo = STATUS_LABELS[s.status] ?? { label: s.status, color: "text-gray-600 bg-gray-50 border-gray-200" };
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3 gap-3">
                  <p className="text-sm text-[var(--text-primary)] truncate">{s.referred_email}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(s.created_at).toLocaleDateString("en-AU")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
