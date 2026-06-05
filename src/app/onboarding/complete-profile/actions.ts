"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapSignupWrites } from "@/lib/signup/bootstrap-writes";
import { industryTagsFromUserMeta } from "@/lib/industries";

import type { CompleteProfileState } from "./state";

export async function retryCompleteProfileSetup(
  _prev: CompleteProfileState,
  _formData?: FormData
): Promise<CompleteProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("[onboarding] auth.getUser failed", userErr);
    return { error: userErr.message };
  }

  if (!user) {
    return { error: "Sign in with the account you created, then try finishing setup again." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[onboarding] admin client unavailable", e);
    return {
      error: "Server configuration error: Supabase service role is missing or invalid. Ask an admin to fix env vars."
    };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? "";
  const name = String(meta.name ?? "").trim();
  const businessName = String(meta.business_name ?? "").trim();
  const accentColourRaw = String(meta.accent_colour ?? "").trim();
  const abn = String(meta.abn ?? "").trim();
  const phoneNumber = String(meta.phone_number ?? "").trim();
  const roleRaw = String(meta.role ?? "owner").trim();
  const role = roleRaw === "client" ? ("client" as const) : ("owner" as const);

  const industry_tags = role === "owner" ? industryTagsFromUserMeta(meta) : [];
  const otherNote =
    role === "owner" && industry_tags.includes("other")
      ? String(meta.industry_other_note ?? "").trim() || null
      : null;

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await new Promise((r) => setTimeout(r, 500));

  const { data: sessionProbe } = await supabase.auth.getSession();
  console.info("[onboarding] session present before bootstrap", Boolean(sessionProbe.session));

  const bootstrap = await bootstrapSignupWrites(
    admin,
    {
      userId: user.id,
      email,
      businessName,
      abn,
      phoneNumber,
      role,
      industry_tags,
      otherNote,
      accentColourRaw,
      full_name: name || email.split("@")[0]
    },
    trialStart,
    trialEnd
  );

  if (!bootstrap.ok) {
    console.error("[onboarding] bootstrap retry failed", bootstrap.step, bootstrap.message);
    let flashExtra = "";
    if (
      bootstrap.step === "core_profile" &&
      role === "client" &&
      (String(bootstrap.message).toLowerCase().includes("enum") || bootstrap.message.includes("22P02"))
    ) {
      flashExtra =
        " Apply migration 0003_profiles_client_role_and_policies.sql so user_role includes 'client'.";
    }
    return { error: bootstrap.message + flashExtra };
  }

  redirect(
    (bootstrap.role === "client" ? "/dashboard/client" : "/dashboard/owner") as Parameters<
      typeof redirect
    >[0]
  );
}
