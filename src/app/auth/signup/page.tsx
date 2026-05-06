import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignupForm } from "@/components/auth/signup-form";
import { parseIndustryTagsJson, type IndustrySlug } from "@/lib/industries";
import { seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { normalizeAccentColour } from "@/lib/brand-accent";

type SignupPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

async function signUp(formData: FormData) {
  "use server";

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

  let industry_tags: IndustrySlug[] = [];
  if (role === "owner") {
    industry_tags = parseIndustryTagsJson(industryTagsJson);
    if (industry_tags.length === 0) {
      redirect(
        ("/auth/signup?error=" + encodeURIComponent("Please select at least one industry.")) as Parameters<
          typeof redirect
        >[0]
      );
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        business_name: businessName,
        abn,
        phone_number: phoneNumber,
        role,
        industry_tags: role === "owner" ? industry_tags.join(",") : ""
      }
    }
  });

  if (error || !data.user) {
    console.error("Signup auth error", {
      error,
      hasUser: Boolean(data?.user),
      hasSession: Boolean(data?.session),
      email
    });
    redirect("/auth/signup?error=Unable%20to%20create%20account");
  }

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const otherNote =
    role === "owner" && industry_tags.includes("other") ? industryOtherNote || null : null;

  let profileError: Error | null = null;
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: name,
        email,
        phone: phoneNumber,
        business_name: businessName,
        abn,
        role,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        subscription_status: "trialing",
        subscription_tier: "solo",
        industry_tags: role === "owner" ? industry_tags : [],
        industry_other_note: role === "owner" ? otherNote : null
      },
      { onConflict: "id" }
    );
    profileError = error ?? null;

    if (!profileError && role === "owner") {
      const accent_colour = normalizeAccentColour(accentColourRaw);
      const bizRes = await adminSupabase.from("businesses").upsert(
        {
          owner_id: data.user.id,
          accent_colour
        },
        { onConflict: "owner_id" }
      );
      if (bizRes.error) {
        console.error("[signup] businesses accent upsert failed", bizRes.error);
      }
    }

    if (!profileError && role === "owner") {
      const seeded = await seedOwnerDemoData(adminSupabase, data.user.id);
      if (!seeded.ok) {
        console.error("[signup] Demo seed failed", seeded.message);
      }
    }
  } catch {
    console.error("Signup profile insert threw before query", {
      email,
      userId: data.user.id
    });
    profileError = new Error("Service role client is not configured");
  }

  if (profileError) {
    console.error("Signup profile insert error", {
      error: profileError,
      email,
      userId: data.user.id
    });
    redirect("/auth/signup?error=Account%20created%20but%20profile%20setup%20failed");
  }

  redirect(role === "client" ? "/dashboard/client" : "/dashboard/owner");
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const sp = searchParams ? await searchParams : {};
  const rawError = sp.error;

  return <SignupForm action={signUp} error={rawError} />;
}
