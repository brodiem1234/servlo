"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseIndustryTagsJson, type IndustrySlug } from "@/lib/industries";
import { bootstrapSignupWrites, describeSupabaseError } from "@/lib/signup/bootstrap-writes";
import { setOnboardingFlashMessage } from "@/lib/onboarding-flash";
import type { SignupFormState } from "./signup-form-state";

export async function signUpAction(_prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "owner").trim();
  const role = roleInput === "client" ? "client" : "owner";

  const industryTagsJson = String(formData.get("industry_tags_json") ?? "[]");
  const industryOtherNote = String(formData.get("industry_other_note") ?? "").trim();
  const accentColourRaw = String(formData.get("accent_colour") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let industry_tags: IndustrySlug[] = [];
  if (role === "owner") {
    industry_tags = parseIndustryTagsJson(industryTagsJson);
  }

  const otherNote =
    role === "owner" && industry_tags.includes("other") ? industryOtherNote || null : null;

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        business_name: businessName,
        abn,
        phone_number: phoneNumber,
        role,
        industry_tags: role === "owner" ? industry_tags.join(",") : "",
        industry_other_note: otherNote ?? "",
        accent_colour: accentColourRaw
      }
    }
  });

  if (authError) {
    console.error("[signup] auth.signUp failed", {
      message: authError.message,
      code: authError.code ?? "",
      email
    });
    return { error: describeSupabaseError("Could not create account:", authError) };
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error("[signup] auth.signUp returned no user id", {
      email,
      session: Boolean(authData.session)
    });
    return {
      error:
        "Account signup did not return a user id. If email confirmation is required, check your inbox — otherwise contact support."
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const { data: sessionProbe } = await supabase.auth.getSession();
  console.info("[signup] session after signUp", Boolean(sessionProbe.session));

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[signup] admin client unavailable", e);
    await setOnboardingFlashMessage(
      "Server configuration error: Supabase service role is missing or invalid. Profile could not be created."
    );
    redirect("/onboarding/complete-profile" as Parameters<typeof redirect>[0]);
  }

  const bootstrap = await bootstrapSignupWrites(
    admin,
    {
      userId,
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
    console.error("[signup] bootstrap failed", bootstrap.step, bootstrap.message);
    let flashMessage = `Account created but profile setup failed. ${bootstrap.message}`;

    if (
      bootstrap.step === "core_profile" &&
      role === "client" &&
      (String(bootstrap.message).toLowerCase().includes("enum") || bootstrap.message.includes("22P02"))
    ) {
      flashMessage +=
        " Apply migration 0003_profiles_client_role_and_policies.sql so user_role includes 'client'.";
    }

    await setOnboardingFlashMessage(flashMessage);
    redirect("/onboarding/complete-profile" as Parameters<typeof redirect>[0]);
  }

  redirect(
    (bootstrap.role === "client" ? "/dashboard/client" : "/dashboard/owner") as Parameters<
      typeof redirect
    >[0]
  );
}
