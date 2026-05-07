import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAllDemoForOwner, seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { normalizeAccentColour } from "@/lib/brand-accent";
import SubscriptionCards from "./subscription-cards";
import { BUSINESSES_UPSERT_ON_CONFLICT, businessesRowForOwner } from "@/lib/businesses";
import { BrandAccentForm } from "./brand-accent-form";
import { ReseedDemoApiButton } from "./reseed-demo-api-button";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import type { IndustrySlug } from "@/lib/industries";
import { isIndustrySlug } from "@/lib/industries";
import {
  FEATURE_DESCRIPTIONS,
  FEATURE_LABELS,
  WORKSPACE_FEATURE_IDS,
  isRecommendedFeatureForIndustry,
  isWorkspaceFeatureId,
  primaryIndustrySlug,
  serializeFeatureFlags,
  type WorkspaceFeatureId
} from "@/lib/workspace-features";
import { WorkspaceFeatureSwitch } from "@/components/workspace-feature-switch";
import { revalidateOwnerWorkspaceRoutes } from "@/lib/dashboard/revalidate-owner";

type SettingsPageProps = {
  searchParams?: {
    success?: string;
    demo?: string;
    demo_msg?: string;
  };
};

export default async function OwnerSettingsPage({ searchParams }: SettingsPageProps) {
  const { user, enabled: workspaceFeatures, supabase } = await requireOwnerWorkspaceFeatures();

  const [profileResult, businessResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, subscription_status, subscription_tier, email_digest_enabled, industry_tags")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("businesses")
      .select("business_name, abn, phone, address, accent_colour, industries")
      .eq("owner_id", user.id)
      .maybeSingle()
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
  const profile = profileResult.data;
  const businessRow = businessResult.data;

  const industriesFromBiz = businessRow?.industries as unknown;
  const tagsFromProfile = (profile as { industry_tags?: unknown } | null)?.industry_tags;
  let primaryIndustry: IndustrySlug = "other";
  if (Array.isArray(industriesFromBiz)) {
    const tags = industriesFromBiz.filter((t): t is IndustrySlug => typeof t === "string" && isIndustrySlug(t));
    if (tags.length) primaryIndustry = primaryIndustrySlug(tags);
  }
  if (primaryIndustry === "other" && Array.isArray(tagsFromProfile)) {
    const tags = tagsFromProfile.filter((t): t is IndustrySlug => typeof t === "string" && isIndustrySlug(t));
    if (tags.length) primaryIndustry = primaryIndustrySlug(tags);
  }

  const businessName = businessRow?.business_name ?? "SERVLO Business";
  const subscriptionTier = profile?.subscription_tier ?? "solo";
  const savedAccent = normalizeAccentColour(businessRow?.accent_colour);
  const digestOn = (profile as { email_digest_enabled?: boolean | null } | null)?.email_digest_enabled !== false;

  async function updateWorkspaceFeaturesAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const { data: prof } = await sb.from("profiles").select("role").eq("id", owner.id).maybeSingle();
    if (prof?.role && prof.role !== "owner") redirect("/dashboard");

    const raw = formData.getAll("feature");
    const next = new Set<WorkspaceFeatureId>();
    for (const x of raw) {
      if (typeof x === "string" && isWorkspaceFeatureId(x)) next.add(x);
    }
    const payload = serializeFeatureFlags(next);
    const { error } = await sb.from("businesses").update({ feature_flags: payload }).eq("owner_id", owner.id);
    if (error) {
      console.error("updateWorkspaceFeatures failed", error);
      throw new Error(error.message);
    }
    revalidateOwnerWorkspaceRoutes();
    revalidatePath("/dashboard/employee");
  }

  async function updateBusinessProfile(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const businessPayload = {
      business_name: String(formData.get("business_name") ?? ""),
      abn: String(formData.get("abn") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? "")
    };
    const upsert = await sb
      .from("businesses")
      .upsert(
        {
          ...businessesRowForOwner(owner.id, { accent_colour: normalizeAccentColour("") }),
          ...businessPayload
        },
        { onConflict: BUSINESSES_UPSERT_ON_CONFLICT }
      )
      .select("id");
    if (upsert.error) throw new Error(upsert.error.message);
    revalidatePath("/dashboard/owner/settings");
    revalidatePath("/dashboard/owner");
  }

  async function resetDemoDataAction() {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    try {
      const admin = createAdminClient();
      await removeAllDemoForOwner(admin, owner.id);
      const seeded = await seedOwnerDemoData(admin, owner.id);
      if (!seeded.ok) {
        redirect(
          `/dashboard/owner/settings?demo=seed_failed&demo_msg=${encodeURIComponent(seeded.message ?? "Unknown error")}`
        );
      }
    } catch (err) {
      redirect(
        `/dashboard/owner/settings?demo=error&demo_msg=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`
      );
    }
    revalidatePath("/dashboard/owner");
    revalidatePath("/dashboard/owner/clients");
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner/employees");
    revalidatePath("/dashboard/owner/settings");
    redirect("/dashboard/owner/settings?demo=reset_ok");
  }

  async function removeAllDemoDataAction() {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    try {
      const admin = createAdminClient();
      await removeAllDemoForOwner(admin, owner.id);
    } catch (err) {
      redirect(
        `/dashboard/owner/settings?demo=error&demo_msg=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`
      );
    }
    revalidatePath("/dashboard/owner");
    revalidatePath("/dashboard/owner/clients");
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner/employees");
    revalidatePath("/dashboard/owner/settings");
    redirect("/dashboard/owner/settings?demo=removed_ok");
  }

  async function updateDigestPreference(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const digest_enabled = String(formData.get("digest_enabled") ?? "true") === "true";
    await sb.from("profiles").update({ email_digest_enabled: digest_enabled }).eq("id", owner.id);
    revalidatePath("/dashboard/owner/settings");
  }

  async function changePassword(formData: FormData) {
    "use server";
    const password = String(formData.get("new_password") ?? "");
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    await sb.auth.updateUser({ password });
    revalidatePath("/dashboard/owner/settings");
  }

  const demoBanner =
    searchParams?.demo === "reset_ok"
      ? { tone: "success" as const, text: "Demo data was reset. Fresh template records are available." }
      : searchParams?.demo === "removed_ok"
        ? { tone: "success" as const, text: "All demo records were removed from your account." }
        : searchParams?.demo === "seed_failed" || searchParams?.demo === "error"
          ? {
              tone: "error" as const,
              text: searchParams.demo_msg
                ? `Demo action failed: ${searchParams.demo_msg}`
                : "Demo action failed. Check that Supabase service role is configured."
            }
          : null;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      {demoBanner ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            demoBanner.tone === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {demoBanner.text}
        </div>
      ) : null}

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Business Profile</h2>
        <form action={updateBusinessProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="business_name" defaultValue={businessRow?.business_name ?? businessName} className="h-10 rounded border px-3" placeholder="Business name" />
          <input name="abn" defaultValue={businessRow?.abn ?? ""} className="h-10 rounded border px-3" placeholder="ABN" />
          <input name="phone" defaultValue={businessRow?.phone ?? ""} className="h-10 rounded border px-3" placeholder="Phone" />
          <input name="address" defaultValue={businessRow?.address ?? ""} className="h-10 rounded border px-3" placeholder="Address" />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">Save Business Profile</button>
          </div>
        </form>
      </article>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Brand Colour</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose one of the preset brand accents — safe contrast on buttons, sidebar highlights and links across your dashboard.
        </p>
        <BrandAccentForm savedAccent={savedAccent} />
      </article>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Workspace features</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Turn modules on or off for your workspace. The sidebar and dashboard update immediately after you save. Features marked{" "}
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-100">
            Recommended
          </span>{" "}
          match your industry defaults.
        </p>
        <form action={updateWorkspaceFeaturesAction} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {WORKSPACE_FEATURE_IDS.map((id) => (
              <WorkspaceFeatureSwitch
                key={id}
                featureId={id}
                formName="feature"
                defaultChecked={workspaceFeatures.has(id)}
                label={
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{FEATURE_LABELS[id]}</span>
                    {isRecommendedFeatureForIndustry(id, primaryIndustry) ? (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:bg-teal-950 dark:text-teal-100">
                        Recommended
                      </span>
                    ) : null}
                  </span>
                }
                description={FEATURE_DESCRIPTIONS[id]}
              />
            ))}
          </div>
          <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">
            Save features
          </button>
        </form>
      </article>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
        <p className="mt-2 text-sm text-slate-600">Daily digest emails summarise jobs due today, unpaid invoices and quotes awaiting acceptance.</p>
        <form action={updateDigestPreference} className="mt-4 space-y-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="digest_enabled" value="true" defaultChecked={digestOn} />
            <span>Send daily digest (recommended)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="digest_enabled" value="false" defaultChecked={!digestOn} />
            <span>Off</span>
          </label>
          <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">
            Save notification preference
          </button>
          <p className="text-xs text-slate-500">
            Schedule <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">GET /api/cron/daily-digest</code> with header{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">Authorization: Bearer CRON_SECRET</code>.
          </p>
        </form>
      </article>

      <SubscriptionCards
        email={user.email ?? ""}
        currentPlan={String(profile?.plan ?? subscriptionTier ?? "trial")}
        success={searchParams?.success === "true"}
        priceIds={{
          solo: process.env.STRIPE_SOLO_PRICE_ID ?? "",
          team: process.env.STRIPE_TEAM_PRICE_ID ?? "",
          business: process.env.STRIPE_BUSINESS_PRICE_ID ?? ""
        }}
      />

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Demo data</h2>
        <p className="mt-2 text-sm text-slate-600">
          On signup we add sample clients, jobs, quotes and invoices so the dashboard is not empty. These rows are tagged as demo,
          stay out of financial totals where noted, and do not support billing emails or similar actions.
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <form action={resetDemoDataAction}>
            <button
              type="submit"
              className="rounded border border-[var(--accent-color)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--accent-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,var(--bg-card))]"
            >
              Reset Demo Data
            </button>
          </form>
          <form action={removeAllDemoDataAction}>
            <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
              Remove All Demo Data
            </button>
          </form>
          <ReseedDemoApiButton userId={user.id} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Reset removes existing demo rows and inserts a fresh template set. Remove deletes demo rows only and leaves your real data untouched.
          “Reseed demo data” calls <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">POST /api/setup-business</code> with{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">demoOnly</code>, matching the signup seed path.
        </p>
      </article>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account</h2>
        <form action={changePassword} className="mt-3 flex flex-col gap-3 sm:max-w-md">
          <input name="new_password" type="password" minLength={8} required className="h-10 rounded border px-3" placeholder="New password" />
          <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">Change Password</button>
        </form>
      </article>
    </section>
  );
}


