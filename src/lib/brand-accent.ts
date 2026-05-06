/** Safe preset accent colours (dashboard + onboarding only). */
export const ACCENT_PRESETS = [
  { label: "Teal", hex: "#0891B2" },
  { label: "Blue", hex: "#2563EB" },
  { label: "Purple", hex: "#7C3AED" },
  { label: "Pink", hex: "#DB2777" },
  { label: "Red", hex: "#DC2626" },
  { label: "Orange", hex: "#EA580C" },
  { label: "Yellow", hex: "#CA8A04" },
  { label: "Green", hex: "#16A34A" }
] as const;

export type AccentPresetHex = (typeof ACCENT_PRESETS)[number]["hex"];

export const DEFAULT_ACCENT_HEX: AccentPresetHex = "#0891B2";

export function normalizeAccentColour(raw: string | null | undefined): AccentPresetHex {
  const v = (raw ?? "").trim().toUpperCase();
  const match = ACCENT_PRESETS.find((p) => p.hex.toUpperCase() === v);
  return match ? match.hex : DEFAULT_ACCENT_HEX;
}
