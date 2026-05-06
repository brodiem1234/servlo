import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AccentColourProvider } from "@/components/dashboard/accent-colour-provider";
import { AccentInlineScript } from "@/components/dashboard/accent-inline-script";
import { normalizeAccentColour, DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";
import { businessesOwnerOrEq } from "@/lib/businesses";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  /** Persisted brand accent from `businesses.accent_colour` (inline script avoids teal flash). */
  let serverAccentHex = DEFAULT_ACCENT_HEX;
  if (user?.id) {
    const { data: businessRow } = await supabase
      .from("businesses")
      .select("accent_colour")
      .or(businessesOwnerOrEq(user.id))
      .maybeSingle();
    serverAccentHex = normalizeAccentColour(businessRow?.accent_colour);
  }

  return (
    <>
      <AccentInlineScript accentHex={serverAccentHex} />
      <AccentColourProvider userId={user?.id ?? null} serverAccentHex={serverAccentHex} />
      {children}
    </>
  );
}
