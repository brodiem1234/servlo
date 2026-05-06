"use client";

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

  const selected = controlled ?? internal;

  function pick(hex: AccentPresetHex) {
    if (controlled === undefined) setInternal(hex);
    onChange?.(hex);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {name ? <input type="hidden" name={name} value={selected} readOnly /> : null}
      {ACCENT_PRESETS.map((p) => {
        const on = selected.toUpperCase() === p.hex.toUpperCase();
        return (
          <button
            key={p.hex}
            type="button"
            aria-label={p.label}
            aria-pressed={on}
            onClick={() => pick(p.hex)}
            title={p.label}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 ${
              on
                ? "scale-[1.06] border-white shadow-md ring-2 ring-slate-900/20 ring-offset-2 ring-offset-[var(--bg-card,white)]"
                : "border-transparent hover:scale-105 hover:shadow-sm"
            }`}
            style={{ backgroundColor: p.hex }}
          >
            {on ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[11px] font-bold leading-none text-[#1e3a5f] shadow-sm">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
