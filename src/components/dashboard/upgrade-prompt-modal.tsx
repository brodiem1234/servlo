"use client";

import { useRouter } from "next/navigation";
import { X, ArrowRight } from "lucide-react";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentPlan: string;
  currentPlanPrice: string;
  currentPlanNote: string;
  requiredPlan: string;
  requiredPlanPrice: string;
  requiredPlanNote: string;
  description: string;
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  feature,
  currentPlan,
  currentPlanPrice,
  currentPlanNote,
  requiredPlan,
  requiredPlanPrice,
  requiredPlanNote,
  description,
}: UpgradePromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleUpgrade() {
    router.push("/dashboard/upgrade");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Lock icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
          🔒
        </div>

        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {feature} requires {requiredPlan}
        </h2>
        <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>

        {/* Plan comparison */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {/* Current plan */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 opacity-60">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Your plan</p>
            <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {currentPlanPrice}
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{currentPlan}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{currentPlanNote}</p>
          </div>

          {/* Arrow */}
          <div className="absolute left-1/2 top-[calc(50%+16px)] -translate-x-1/2 translate-y-8">
            <ArrowRight size={16} className="text-[var(--text-muted)]" />
          </div>

          {/* Required plan */}
          <div className="rounded-xl border-2 border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_8%,transparent)] p-3">
            <p className="text-xs font-medium" style={{ color: "var(--accent-color)" }}>Upgrade to</p>
            <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {requiredPlanPrice}
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{requiredPlan}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{requiredPlanNote}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-color)" }}
          >
            Upgrade to {requiredPlan}
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-muted)" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
