import { useEffect, useLayoutEffect } from "react";
import { normalizeAccentHexForCss } from "@/lib/brand-accent";
import { applyAccentToDocument, readStoredAccentHex } from "@/lib/dashboard/accent-css";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Hydration: prefer localStorage cache (instant, matches inline boot script), else SSR hex.
 * Then confirm against `businesses.accent_colour` for `owner_id = auth.uid()` and persist cache.
 */
export function useAccentColour(userId: string | null | undefined, serverAccentHex: string) {
  useLayoutEffect(() => {
    const stored = readStoredAccentHex();
    if (stored) {
      applyAccentToDocument(stored);
      return;
    }
    applyAccentToDocument(serverAccentHex);
  }, [serverAccentHex]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowser();
        const { data, error } = await sb
          .from("businesses")
          .select("accent_colour")
          .eq("owner_id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.warn("[accent] could not load businesses.accent_colour", error);
          return;
        }
        if (data?.accent_colour) {
          applyAccentToDocument(normalizeAccentHexForCss(String(data.accent_colour)), { persist: true });
        }
      } catch (e) {
        console.warn("[accent] unexpected error loading accent_colour", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}
