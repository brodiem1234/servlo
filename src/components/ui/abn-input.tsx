"use client";

import { useState } from "react";
import { validateABN } from "@/lib/abn-validator";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * ABN input with inline validation.
 * Validates on blur using the official ATO checksum algorithm.
 */
export function ABNInput({
  value,
  onChange,
  id,
  name,
  placeholder = "e.g. 51 824 753 556",
  className,
  required,
  disabled,
}: Props) {
  const [touched, setTouched] = useState(false);

  const validation = touched && value.replace(/\D/g, "").length > 0
    ? validateABN(value)
    : null;

  function handleBlur() {
    setTouched(true);
    // Auto-format if valid
    if (value) {
      const result = validateABN(value);
      if (result.valid) {
        onChange(result.formatted);
      }
    }
  }

  const baseCls = "h-10 w-full rounded-lg border bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2";
  const borderCls = validation === null
    ? "border-[var(--border)] focus:ring-[var(--accent-color)]"
    : validation.valid
      ? "border-green-500 focus:ring-green-500"
      : "border-red-500 focus:ring-red-500";

  return (
    <div className="space-y-1">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setTouched(false); }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${baseCls} ${borderCls} ${className ?? ""}`}
        required={required}
        disabled={disabled}
        maxLength={14} // XX XXX XXX XXX = 14 chars with spaces
        inputMode="numeric"
      />
      {validation !== null && (
        <p className={`text-xs ${validation.valid ? "text-green-500" : "text-red-500"}`}>
          {validation.valid ? `✓ Valid ABN — ${validation.formatted}` : `✗ ${validation.error}`}
        </p>
      )}
    </div>
  );
}
