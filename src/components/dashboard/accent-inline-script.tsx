import { ACCENT_LOCAL_STORAGE_KEY, ACCENT_LOCAL_STORAGE_KEY_LEGACY } from "@/lib/dashboard/accent-css";
import { DEFAULT_ACCENT_HEX, normalizeAccentHexForCss } from "@/lib/brand-accent";

type Props = {
  accentHex: string;
};

/**
 * Runs synchronously when parsed: applies cached localStorage accent first (no flash),
 * otherwise falls back to the server-loaded value from `businesses.accent_colour`.
 */
export function AccentInlineScript({ accentHex }: Props) {
  const fallback = normalizeAccentHexForCss(accentHex || DEFAULT_ACCENT_HEX);
  const keyJson = JSON.stringify(ACCENT_LOCAL_STORAGE_KEY);
  const legacyKeyJson = JSON.stringify(ACCENT_LOCAL_STORAGE_KEY_LEGACY);
  const fallbackJson = JSON.stringify(fallback);
  const js = `(function(){try{var KEY=${keyJson};var LEGACY=${legacyKeyJson};var FALLBACK=${fallbackJson};var r=document.documentElement;var cand=null;try{cand=localStorage.getItem(KEY);}catch(e){}if(!cand){try{cand=localStorage.getItem(LEGACY);}catch(e){}}function hover(h){return "color-mix(in srgb, "+h+" 82%, black)";}function ok(h){return typeof h==="string"&&/^#[0-9A-Fa-f]{6}$/.test(h.trim());}var h=ok(cand)?cand.trim().toUpperCase():FALLBACK;r.style.setProperty("--accent-color",h);r.style.setProperty("--accent-hover",hover(h));}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
