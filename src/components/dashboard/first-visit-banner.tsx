"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

type Props = {
  pageKey: string;
  title: string;
  description: string;
  helpUrl?: string;
};

export default function FirstVisitBanner({ pageKey, title, description, helpUrl }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem(`servlo_visited_${pageKey}`) === "true") {
        setDismissed(true);
      }
    }
    setChecked(true);
  }, [pageKey]);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(`servlo_visited_${pageKey}`, "true");
    }
    setDismissed(true);
  }

  if (!checked || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm mb-4">
      <Info size={16} className="mt-0.5 shrink-0 text-[var(--accent-color)]" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        {helpUrl ? (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-[var(--accent-color)] hover:underline"
          >
            Learn more →
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
