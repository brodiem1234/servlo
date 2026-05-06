"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeAccentColour } from "@/lib/brand-accent";
import { BUSINESSES_UPSERT_ON_CONFLICT, businessesOwnerOrEq, businessesRowForOwner } from "@/lib/businesses";

export type SaveBrandAccentResult = { ok: true } | { ok: false; message: string };

export async function saveBrandAccentAction(formData: FormData): Promise<SaveBrandAccentResult> {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user?.id) {
    return { ok: false, message: "Not signed in." };
  }

  const accent_colour = normalizeAccentColour(String(formData.get("accent_colour") ?? ""));

  const updated = await sb
    .from("businesses")
    .update({ accent_colour })
    .or(businessesOwnerOrEq(user.id))
    .select("id");

  if (updated.error) {
    console.error("[settings] businesses.update accent_colour failed", updated.error);
    return { ok: false, message: updated.error.message };
  }

  if (!updated.data?.length) {
    const ins = await sb
      .from("businesses")
      .upsert(businessesRowForOwner(user.id, { accent_colour }), {
        onConflict: BUSINESSES_UPSERT_ON_CONFLICT
      })
      .select("id");

    if (ins.error) {
      console.error("[settings] businesses.upsert accent_colour failed", ins.error);
      return { ok: false, message: ins.error.message };
    }
  }

  revalidatePath("/dashboard/owner/settings");
  revalidatePath("/dashboard/owner");
  return { ok: true };
}
