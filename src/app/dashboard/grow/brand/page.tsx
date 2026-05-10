import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandManager } from "./brand-manager";

export const dynamic = "force-dynamic";

export default async function BrandKitPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: biz } = await sb
    .from("businesses")
    .select("business_name, phone, email, address, suburb, state, abn, accent_colour, logo_url, tagline, brand_voice")
    .eq("owner_id", user.id)
    .maybeSingle();

  const brand = {
    business_name: (biz as any)?.business_name ?? null,
    phone: (biz as any)?.phone ?? null,
    email: (biz as any)?.email ?? null,
    address: (biz as any)?.address ?? null,
    suburb: (biz as any)?.suburb ?? null,
    state: (biz as any)?.state ?? null,
    abn: (biz as any)?.abn ?? null,
    accent_colour: (biz as any)?.accent_colour ?? null,
    logo_url: (biz as any)?.logo_url ?? null,
    tagline: (biz as any)?.tagline ?? null,
    brand_voice: (biz as any)?.brand_voice ?? null,
  };

  async function saveAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const sbAction = await createClient();
    const { data: { user: owner } } = await sbAction.auth.getUser();
    if (!owner) return { ok: false, error: "Not authenticated" };

    const accent_colour = String(formData.get("accent_colour") ?? "").trim();
    const tagline = String(formData.get("tagline") ?? "").trim().slice(0, 100);
    const brand_voice = String(formData.get("brand_voice") ?? "").trim();

    const update: Record<string, string> = {};
    if (accent_colour) update.accent_colour = accent_colour;
    if (tagline !== undefined) update.tagline = tagline;
    if (brand_voice) update.brand_voice = brand_voice;

    const { error } = await sbAction
      .from("businesses")
      .update(update)
      .eq("owner_id", owner.id);

    if (error) {
      // If tagline/brand_voice columns don't exist yet, save what we can
      if (error.code === "42703") {
        const fallback: Record<string, string> = {};
        if (accent_colour) fallback.accent_colour = accent_colour;
        if (Object.keys(fallback).length > 0) {
          await sbAction.from("businesses").update(fallback).eq("owner_id", owner.id);
        }
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  return <BrandManager brand={brand} saveAction={saveAction} />;
}
