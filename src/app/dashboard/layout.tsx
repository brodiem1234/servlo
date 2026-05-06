import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AccentColourProvider } from "@/components/dashboard/accent-colour-provider";
import { AccentInlineScript } from "@/components/dashboard/accent-inline-script";
import { normalizeAccentHexForCss, DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  /** Persisted brand accent — matches `WHERE owner_id = auth.uid()` via RLS/session user id. */
  let serverAccentHex: string = DEFAULT_ACCENT_HEX;
  if (user?.id) {
    const { data: businessRow } = await supabase
      .from("businesses")
      .select("accent_colour")
      .eq("owner_id", user.id)
      .maybeSingle();
    serverAccentHex = normalizeAccentHexForCss(businessRow?.accent_colour);
  }

  return (
    <>
      <AccentInlineScript accentHex={serverAccentHex} />
      <AccentColourProvider userId={user?.id ?? null} serverAccentHex={serverAccentHex} />
      {children}
    </>
  );
}
