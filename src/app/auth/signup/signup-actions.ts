"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseIndustryTagsJson, type IndustrySlug } from "@/lib/industries";
import {
  allPasswordRequirementsMet,
  normalizePasswordStrength,
  validatePhoneMinimum
} from "@/lib/auth/signup-field-validation";
import { bootstrapSignupProfiles, describeSupabaseError } from "@/lib/signup/bootstrap-writes";
import { waitForSessionAfterSignUp } from "@/lib/signup/wait-for-session";
import { setOnboardingFlashMessage } from "@/lib/onboarding-flash";
import type { SignupFormState } from "./signup-form-state";

const INVITE_ROLES = new Set(["employee", "contractor", "client"]);

/**
 * Employee, contractor, and client self-signup via server action.
 * Business owners and managers complete signup in the browser + `/api/setup-business`.
 */
export async function signUpAction(_prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const inviteCode = String(formData.get("invite_code") ?? "").trim();
  const rawRole = String(formData.get("role") ?? "owner").trim().toLowerCase();

  const industryTagsJson = String(formData.get("industry_tags_json") ?? "[]");
  const industryOtherNote = String(formData.get("industry_other_note") ?? "").trim();
  const accentColourRaw = String(formData.get("accent_colour") ?? "").trim();

  if (!INVITE_ROLES.has(rawRole)) {
    return {
      error:
        "Business owners and managers finish signup using the onboarding steps above. Pick Employee, Contractor, or Client to register with an invite code instead."
    };
  }

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const pwdChecks = normalizePasswordStrength(password, name, email);
  if (!allPasswordRequirementsMet(pwdChecks)) {
    return { error: "Password does not meet all requirements." };
  }

  if (!inviteCode) {
    return { error: "Invite code is required." };
  }

  if (!validatePhoneMinimum(phoneNumber)) {
    return { error: "Phone number must contain at least 10 digits." };
  }

  let industry_tags: IndustrySlug[] = [];
  industry_tags = parseIndustryTagsJson(industryTagsJson);

  const otherNote = industry_tags.includes("other") ? industryOtherNote || null : null;

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const profileRole = rawRole === "client" ? ("client" as const) : ("employee" as const);

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        business_name: businessName || null,
        abn: abn || null,
        phone_number: phoneNumber,
        role: rawRole,
        signup_intent: rawRole,
        invite_code: inviteCode,
        industry_tags: industry_tags.join(","),
        industry_other_note: otherNote ?? "",
        accent_colour: accentColourRaw || ""
      }
    }
  });

  if (authError) {
    console.error("[signup/invite-role] auth.signUp failed", {
      message: authError.message,
      code: authError.code ?? "",
      email
    });
    return { error: describeSupabaseError("Could not create account:", authError) };
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error("[signup/invite-role] auth.signUp returned no user id", {
      email,
      session: Boolean(authData.session)
    });
    return {
      error:
        "Account signup did not return a user id. If email confirmation is required, check your inbox, otherwise contact support."
    };
  }

  if (authData.session?.access_token && authData.session.refresh_token) {
    const { error: setErr } = await supabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    });
    if (setErr) {
      console.error("[signup/invite-role] setSession right after signUp failed", setErr.message, setErr);
    }
  }

  await waitForSessionAfterSignUp(supabase, authData.session ?? null);

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[signup/invite-role] admin client unavailable", e);
    await setOnboardingFlashMessage(
      "Server configuration error: Supabase service role is missing or invalid. Profile could not be created."
    );
    redirect("/onboarding/complete-profile" as Parameters<typeof redirect>[0]);
  }

  const profileBootstrap = await bootstrapSignupProfiles(
    admin,
    {
      userId,
      email,
      businessName: "",
      abn: "",
      phoneNumber,
      role: profileRole,
      industry_tags: [],
      otherNote: null,
      accentColourRaw,
      full_name: name || email.split("@")[0]
    },
    trialStart,
    trialEnd
  );

  if (!profileBootstrap.ok) {
    console.error("[signup/invite-role] profile bootstrap failed", profileBootstrap.message);
    let flashMessage = `Account created but profile setup failed. ${profileBootstrap.message}`;
    if (
      String(profileBootstrap.message).toLowerCase().includes("enum") ||
      profileBootstrap.message.includes("22P02")
    ) {
      flashMessage +=
        " Confirm `user_role` in Supabase supports 'client' and 'employee'.";
    }
    await setOnboardingFlashMessage(flashMessage);
    redirect("/onboarding/complete-profile" as Parameters<typeof redirect>[0]);
  }

  if (profileBootstrap.role === "client") {
    redirect("/dashboard/client" as Parameters<typeof redirect>[0]);
  }

  redirect("/dashboard/owner" as Parameters<typeof redirect>[0]);
}
