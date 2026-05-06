"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_HEX,
  normalizeAccentColour,
  type AccentPresetHex
} from "@/lib/brand-accent";

type Props = {
  /** When set, field is included for native forms */
  name?: string;
  /** Controlled selection */
  value?: AccentPresetHex;
  /** Uncontrolled initial value */
  defaultValue?: string | null;
  onChange?: (hex: AccentPresetHex) => void;
};

export function BrandAccentSwatches({ name, value: controlled, defaultValue, onChange }: Props) {
  const initial = normalizeAccentColour(controlled ?? defaultValue ?? DEFAULT_ACCENT_HEX);
  const [internal, setInternal] = useState<AccentPresetHex>(initial);

  useEffect(() => {
    if (controlled === undefined && defaultValue !== undefined) {
      setInternal(normalizeAccentColour(defaultValue));
    }
  }, [controlled, defaultValue]);

  useEffect(() => {
    if (controlled !== undefined) {
      setInternal(normalizeAccentColour(controlled));
    }
  }, [controlled]);

  const selected = controlled ?? internal;

  function pick(hex: AccentPresetHex) {
    if (controlled === undefined) setInternal(hex);
    onChange?.(hex);
  }

  return (
    <div
      role="group"
      aria-label="Brand accent colour"
      className="rounded-xl border border-slate-300 bg-slate-50/90 p-4 dark:border-slate-600 dark:bg-slate-900/40"
    >
      {name ? <input type="hidden" name={name} value={selected} readOnly /> : null}
      <div className="flex flex-wrap gap-3">
        {ACCENT_PRESETS.map((p) => {
          const on = selected.toUpperCase() === p.hex.toUpperCase();
          return (
            <button
              key={p.hex}
              type="button"
              aria-label={`${p.label}${on ? ", selected" : ""}`}
              aria-pressed={on}
              onClick={() => pick(p.hex)}
              title={p.label}
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--bg-card,#1a2f45)] ${
                on
                  ? "z-[1] scale-105 border-white shadow-md ring-2 ring-[#0f172a] ring-offset-2 ring-offset-[var(--bg-card,#ffffff)] dark:border-white dark:ring-white dark:ring-offset-[var(--bg-card,#1a2f45)]"
                  : "border-slate-500/90 hover:scale-105 hover:border-slate-700 hover:shadow-md dark:border-slate-400 dark:hover:border-slate-200"
              }`}
              style={{ backgroundColor: p.hex }}
            >
              {on ? (
                <span className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0f172a] shadow-md ring-1 ring-black/15 dark:bg-white dark:text-[#0f172a]">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {!name ? (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          Saved when you finish signup. You can change it anytime in Settings.
        </p>
      ) : null}
    </div>
  );
}
