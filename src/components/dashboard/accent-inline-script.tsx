import { DEFAULT_ACCENT_HEX, normalizeAccentColour } from "@/lib/brand-accent";

type Props = {
  accentHex: string;
};

/**
 * Runs synchronously when parsed so the first paint uses the saved accent instead of default teal.
 */
export function AccentInlineScript({ accentHex }: Props) {
  const safe = normalizeAccentColour(accentHex || DEFAULT_ACCENT_HEX);
  const js = `(function(){try{var h=${JSON.stringify(safe)};var r=document.documentElement;r.style.setProperty("--accent-color",h);r.style.setProperty("--accent-hover","color-mix(in srgb, "+h+" 82%, black)");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
