import { normalizeAccentHexForCss } from "@/lib/brand-accent";

/** Cache key — keep in sync with inline boot script in `accent-inline-script.tsx`. */
export const ACCENT_LOCAL_STORAGE_KEY = "servlo-accent-color";
/** Legacy key used in older builds. */
export const ACCENT_LOCAL_STORAGE_KEY_LEGACY = "accent-color";

export type ApplyAccentOptions = {
  /** When true, also writes `ACCENT_LOCAL_STORAGE_KEY` (Settings save + DB confirmation). */
  persist?: boolean;
};

export function readStoredAccentHex(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(ACCENT_LOCAL_STORAGE_KEY) ??
      localStorage.getItem(ACCENT_LOCAL_STORAGE_KEY_LEGACY);
    const v = (raw ?? "").trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  } catch {
    /* ignore */
  }
  return null;
}

/** Sets owner accent on `<html>` + optional localStorage cache. */
export function applyAccentToDocument(rawHex: string, options?: ApplyAccentOptions) {
  if (typeof document === "undefined") return;
  const hex = normalizeAccentHexForCss(rawHex);
  const root = document.documentElement;
  root.style.setProperty("--accent-color", hex);
  root.style.setProperty("--accent-hover", `color-mix(in srgb, ${hex} 82%, black)`);
  if (options?.persist !== true) return;
  try {
    localStorage.setItem(ACCENT_LOCAL_STORAGE_KEY, hex);
    localStorage.removeItem(ACCENT_LOCAL_STORAGE_KEY_LEGACY);
  } catch {
    /* ignore */
  }
}
