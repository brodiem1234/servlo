import { normalizeAccentColour } from "@/lib/brand-accent";

/** Sets owner accent on <html> so all dashboard pages and portals using var(--accent-*) update together. */
export function applyAccentToDocument(rawHex: string) {
  if (typeof document === "undefined") return;
  const hex = normalizeAccentColour(rawHex);
  const root = document.documentElement;
  root.style.setProperty("--accent-color", hex);
  root.style.setProperty("--accent-hover", `color-mix(in srgb, ${hex} 82%, black)`);
}
