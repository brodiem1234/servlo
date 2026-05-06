import { useEffect, useLayoutEffect } from "react";
import { normalizeAccentColour } from "@/lib/brand-accent";
import { businessesOwnerOrEq } from "@/lib/businesses";
import { applyAccentToDocument } from "@/lib/dashboard/accent-css";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Keeps document root accent in sync with `businesses.accent_colour` for the signed-in user.
 * `serverAccentHex` runs from the server on first paint (via inline script); this reconciles after hydration.
 */
export function useAccentColour(userId: string | null | undefined, serverAccentHex: string) {
  useLayoutEffect(() => {
    applyAccentToDocument(serverAccentHex);
  }, [serverAccentHex]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = createSupabaseBrowser();
        const { data, error } = await sb
          .from("businesses")
          .select("accent_colour")
          .or(businessesOwnerOrEq(userId))
          .maybeSingle();
        if (cancelled || error || !data?.accent_colour) return;
        applyAccentToDocument(normalizeAccentColour(String(data.accent_colour)));
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}
