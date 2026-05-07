"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type WorkspaceFeatureSwitchProps = {
  featureId?: string;
  formName?: "feature";
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
};

/** Pill switch (~64×28px track, 24px knob), ON/OFF, accent vs grey; entire row clickable. */
export function WorkspaceFeatureSwitch({
  featureId,
  formName,
  defaultChecked = false,
  checked: controlledChecked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className = ""
}: WorkspaceFeatureSwitchProps) {
  const gid = useId();
  const [inner, setInner] = useState(defaultChecked);
  const isControlled = typeof controlledChecked === "boolean";
  const on = isControlled ? controlledChecked : inner;

  const propagate = (next: boolean) => {
    if (disabled) return;
    if (!isControlled) setInner(next);
    onCheckedChange?.(next);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] transition-colors focus-within:ring-2 focus-within:ring-[var(--accent-color)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--bg-card)]",
        disabled ? "pointer-events-none opacity-60" : "",
        className
      )}
    >
      <label
        htmlFor={gid}
        className={`flex w-full cursor-pointer items-start gap-3 px-3 py-3 hover:bg-[color-mix(in_srgb,var(--bg-primary)_88%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--bg-card)_92%,transparent)] ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <input
          id={gid}
          type="checkbox"
          role="switch"
          aria-checked={on}
          disabled={disabled}
          className="sr-only"
          checked={on}
          onChange={(e) => propagate(e.target.checked)}
          {...(formName && featureId ? { name: formName, value: featureId } : {})}
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
          {description ? (
            <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        <span
          aria-hidden
          className="relative mt-0.5 inline-flex h-7 w-16 shrink-0 items-center rounded-full p-0.5"
        >
          <span
            className={`pointer-events-none absolute inset-0 rounded-full transition-colors duration-200 ease-out ${
              on ? "bg-[var(--accent-color)]" : "bg-neutral-400 dark:bg-neutral-600"
            }`}
          />
          <span
            className={`pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide transition-opacity duration-200 ${
              on ? "text-white opacity-100" : "opacity-0"
            }`}
          >
            ON
          </span>
          <span
            className={`pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide transition-opacity duration-200 ${
              on ? "opacity-0" : "text-neutral-200 opacity-100 dark:text-neutral-400"
            }`}
          >
            OFF
          </span>
          <span
            className={`pointer-events-none absolute left-[2px] top-1/2 z-20 size-6 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out dark:ring-white/15 ${
              on ? "translate-x-9" : "translate-x-0"
            }`}
          />
        </span>
      </label>
    </div>
  );
}
