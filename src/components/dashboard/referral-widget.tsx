"use client";

import { useState } from "react";
import { Gift, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  referralUrl: string;
};

export function ReferralWidget({ referralUrl }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-[var(--accent-color)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Refer a tradie — get $20 credit
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-4 space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Share your link. When they subscribe, you both get $20 account credit.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] truncate">
              {referralUrl}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 shrink-0"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <a
            href="/dashboard/owner/settings/referrals"
            className="text-xs text-[var(--accent-color)] hover:underline"
          >
            View referral history →
          </a>
        </div>
      )}
    </div>
  );
}
