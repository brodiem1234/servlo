"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bootstrapSignupWrites,
  seedOwnerDemoNonFatal,
  upsertOwnerBusinessRow
} from "@/lib/signup/bootstrap-writes";
import { industryTagsFromUserMeta } from "@/lib/industries";

import type { CompleteProfileState } from "./state";

const TEAM_MEMBER_METADATA_ROLES = new Set(["employee", "contractor", "manager"]);

function signupRoleFromMetadata(meta: Record<string, unknown>): "owner" | "client" | "employee" {
  const roleRaw = String(meta.role ?? meta.signup_intent ?? "owner").trim().toLowerCase();
  if (roleRaw === "client") return "client";
  if (TEAM_MEMBER_METADATA_ROLES.has(roleRaw)) return "employee";
  return "owner";
}

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
  const role = signupRoleFromMetadata(meta);

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

  const { data: profileRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const existingRole = String((profileRow as { role?: string } | null)?.role ?? "").toLowerCase();

  if (existingRole === "employee" || existingRole === "contractor") {
    redirect("/dashboard/employee" as Parameters<typeof redirect>[0]);
  }

  if (existingRole === "client") {
    redirect("/dashboard/client" as Parameters<typeof redirect>[0]);
  }

  if (existingRole === "owner") {
    const bizRetry = await upsertOwnerBusinessRow(admin, user.id, accentColourRaw);
    if (bizRetry.ok) {
      await seedOwnerDemoNonFatal(admin, user.id);
      redirect("/dashboard/owner" as Parameters<typeof redirect>[0]);
    }
    console.warn("[onboarding] business-only retry failed, falling back to full bootstrap", bizRetry.message);
  }

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
    (bootstrap.role === "client"
      ? "/dashboard/client"
      : bootstrap.role === "employee"
        ? "/dashboard/employee"
        : "/dashboard/owner") as Parameters<typeof redirect>[0]
  );
}
