import React from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAllDemoForOwner, seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { normalizeAccentColour } from "@/lib/brand-accent";
// SubscriptionCards replaced by BillingTab client component
import { BUSINESSES_UPSERT_ON_CONFLICT, businessesRowForOwner } from "@/lib/businesses";
import { BrandAccentForm } from "./brand-accent-form";
import { ReseedDemoApiButton } from "./reseed-demo-api-button";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import type { IndustrySlug } from "@/lib/industries";
import { isIndustrySlug } from "@/lib/industries";
import {
  CORE_FEATURE_IDS,
  FEATURE_DESCRIPTIONS,
  FEATURE_LABELS,
  WORKSPACE_FEATURE_IDS,
  isOptionalFeatureId,
  isRecommendedFeatureForIndustry,
  primaryIndustrySlug,
  serializeFeatureFlags,
  type WorkspaceFeatureId
} from "@/lib/workspace-features";
import { WorkspaceFeatureSwitch } from "@/components/workspace-feature-switch";
import { revalidateOwnerWorkspaceRoutes } from "@/lib/dashboard/revalidate-owner";
// XeroImportExport moved into ImportExportTab client component
import {
  NotificationsForm,
  DemoDataButtons,
  BillingTab,
  IntegrationsTab,
  ImportExportTab,
  DangerZoneTab,
} from "./settings-client";

// ── Types ──────────────────────────────────────────────────────────────────

type SettingsPageProps = {
  searchParams?: Promise<{
    success?: string;
    demo?: string;
    demo_msg?: string;
    tab?: string;
    from?: string;
  }>;
};

type NotificationPrefs = {
  invoice_paid: boolean;
  new_job_created: boolean;
  job_completed: boolean;
  quote_accepted: boolean;
  overdue_invoice_reminder: boolean;
  overdue_invoice_frequency: 7 | 14 | 30;
  trial_ending_reminder: boolean;
};

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  invoice_paid: true,
  new_job_created: true,
  job_completed: true,
  quote_accepted: true,
  overdue_invoice_reminder: true,
  overdue_invoice_frequency: 14,
  trial_ending_reminder: true
};

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
  { id: "workspace", label: "Workspace" },
  { id: "notifications", label: "Notifications" },
  { id: "import-export", label: "Import / Export" },
  { id: "integrations", label: "Integrations" },
  { id: "demo-data", label: "Demo Data" },
  { id: "danger", label: "Danger Zone" }
] as const;

type TabId = (typeof TABS)[number]["id"];

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

// ── Card wrapper ──────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default async function OwnerSettingsPage({ searchParams }: SettingsPageProps) {
  const { user, enabled: workspaceFeatures, supabase } = await requireOwnerWorkspaceFeatures();
  const resolvedParams = await searchParams;
  const activeTab: TabId = (resolvedParams?.tab as TabId | undefined) ?? "profile";
  const fromProduct = resolvedParams?.from ?? "core";

  const productLabel =
    fromProduct === "grow" ? "SERVLO GROW"
    : fromProduct === "leads" ? "SERVLO LEADS"
    : "SERVLO CORE";
  const productBackHref =
    fromProduct === "grow" ? "/dashboard/grow"
    : fromProduct === "leads" ? "/dashboard/leads"
    : "/dashboard/owner";
  const productColour =
    fromProduct === "grow" ? "#8B5CF6"
    : fromProduct === "leads" ? "#F59E0B"
    : "#3B82F6";
  const productRgb =
    fromProduct === "grow" ? "139,92,246"
    : fromProduct === "leads" ? "245,158,11"
    : "59,130,246";

  const [profileResult, businessResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "plan, subscription_status, subscription_tier, stripe_customer_id, email_digest_enabled, industry_tags, trial_start, trial_end"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("businesses")
      .select("business_name, abn, phone, address, suburb, state, postcode, accent_colour, industries, entity_name")
      .eq("owner_id", user.id)
      .maybeSingle()
  ]);

  if (profileResult.error) {
    console.error("[settings] profile query failed:", profileResult.error.message);
  }

  const profile = profileResult.error ? null : (profileResult.data as {
    plan?: string | null;
    subscription_status?: string | null;
    subscription_tier?: string | null;
    stripe_customer_id?: string | null;
    email_digest_enabled?: boolean | null;
    industry_tags?: unknown;
    trial_start?: string | null;
    trial_end?: string | null;
  } | null);

  const businessRow = businessResult.data;

  // Fetch notification_preferences separately — column may not exist on all DB versions
  let savedNotifPrefs: unknown = null;
  try {
    const notifResult = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .maybeSingle();
    if (!notifResult.error) {
      savedNotifPrefs = (notifResult.data as { notification_preferences?: unknown } | null)?.notification_preferences ?? null;
    }
  } catch {
    // Column may not exist — use defaults
  }

  // Industry resolution
  const industriesFromBiz = businessRow?.industries as unknown;
  const tagsFromProfile = profile?.industry_tags;
  let primaryIndustry: IndustrySlug = "other";
  if (Array.isArray(industriesFromBiz)) {
    const tags = industriesFromBiz.filter((t): t is IndustrySlug => typeof t === "string" && isIndustrySlug(t));
    if (tags.length) primaryIndustry = primaryIndustrySlug(tags);
  }
  if (primaryIndustry === "other" && Array.isArray(tagsFromProfile)) {
    const tags = tagsFromProfile.filter((t): t is IndustrySlug => typeof t === "string" && isIndustrySlug(t));
    if (tags.length) primaryIndustry = primaryIndustrySlug(tags);
  }

  const savedAccent = normalizeAccentColour(businessRow?.accent_colour);
  const subscriptionTier = profile?.subscription_tier ?? "solo";
  const currentPlan = String(profile?.plan ?? subscriptionTier ?? "trial");
  const isOnTrial = currentPlan === "trial" || profile?.subscription_status === "trialing";
  const stripeConnected = Boolean(profile?.stripe_customer_id);

  // Trial days remaining
  let trialDaysRemaining: number | null = null;
  if (isOnTrial && profile?.trial_end) {
    const end = new Date(profile.trial_end);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    trialDaysRemaining = Math.max(0, diff);
  }

  // Notification prefs
  const notifPrefs: NotificationPrefs = {
    ...DEFAULT_NOTIF_PREFS,
    ...(typeof savedNotifPrefs === "object" && savedNotifPrefs !== null ? (savedNotifPrefs as Partial<NotificationPrefs>) : {})
  };

  // ── Banner ────────────────────────────────────────────────────────────
  const demoBanner =
    resolvedParams?.demo === "reset_ok"
      ? { tone: "success" as const, text: "Demo data was reset. Fresh template records are available." }
      : resolvedParams?.demo === "removed_ok"
        ? { tone: "success" as const, text: "All demo records were removed from your account." }
        : resolvedParams?.demo === "seed_failed" || resolvedParams?.demo === "error"
          ? {
              tone: "error" as const,
              text: resolvedParams.demo_msg
                ? `Demo action failed: ${resolvedParams.demo_msg}`
                : "Demo action failed. Check that Supabase service role is configured."
            }
          : null;

  // ── Server actions ─────────────────────────────────────────────────────

  async function updateProfileAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");

    const suburb = String(formData.get("suburb") ?? "");
    const state = String(formData.get("state") ?? "");
    const postcode = String(formData.get("postcode") ?? "");

    const businessPayload = {
      business_name: String(formData.get("business_name") ?? ""),
      abn: String(formData.get("abn") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      suburb: suburb || null,
      state: state || null,
      postcode: postcode || null
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
    const next = new Set<WorkspaceFeatureId>(CORE_FEATURE_IDS);
    for (const x of raw) {
      if (typeof x === "string" && isOptionalFeatureId(x)) next.add(x);
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

  async function saveNotificationPrefsAction(prefs: NotificationPrefs) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    await sb
      .from("profiles")
      .update({ notification_preferences: prefs as unknown as Record<string, unknown> })
      .eq("id", owner.id);
    revalidatePath("/dashboard/owner/settings");
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
          `/dashboard/owner/settings?tab=demo-data&demo=seed_failed&demo_msg=${encodeURIComponent(seeded.message ?? "Unknown error")}`
        );
      }
    } catch (err) {
      redirect(
        `/dashboard/owner/settings?tab=demo-data&demo=error&demo_msg=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`
      );
    }
    revalidatePath("/dashboard/owner");
    revalidatePath("/dashboard/owner/clients");
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner/employees");
    revalidatePath("/dashboard/owner/settings");
    redirect("/dashboard/owner/settings?tab=demo-data&demo=reset_ok");
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
        `/dashboard/owner/settings?tab=demo-data&demo=error&demo_msg=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`
      );
    }
    revalidatePath("/dashboard/owner");
    revalidatePath("/dashboard/owner/clients");
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/quotes");
    revalidatePath("/dashboard/owner/invoices");
    revalidatePath("/dashboard/owner/employees");
    revalidatePath("/dashboard/owner/settings");
    redirect("/dashboard/owner/settings?tab=demo-data&demo=removed_ok");
  }

  // deleteAccountAction removed — account deletion now via email (DangerZoneTab)
  // completeOnboardingAction removed — onboarding tour now lives on dashboard only

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <section
      className="space-y-6"
      style={{ "--product-accent": productColour, "--product-rgb": productRgb } as React.CSSProperties}
    >
      {/* Product context header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a
            href={productBackHref}
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span aria-hidden>←</span> Back to {productLabel}
          </a>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{productLabel} — Settings</h1>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-0 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={`/dashboard/owner/settings?tab=${tab.id}${fromProduct !== "core" ? `&from=${fromProduct}` : ""}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-[var(--product-accent)] text-[var(--product-accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Banner */}
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

      {/* ── Profile tab ─────────────────────────────────────────────────── */}
      {activeTab === "profile" ? (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Business Profile</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Your business details — shown on invoices, quotes and client communications.</p>
          <form action={updateProfileAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Trading name</label>
              <input
                name="business_name"
                defaultValue={businessRow?.business_name ?? ""}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                placeholder="ACME Plumbing"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Registered entity name</label>
              <div className="bg-gray-100 dark:bg-[#161d2e] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] cursor-not-allowed opacity-70">
                {(businessRow as { entity_name?: string | null } | null)?.entity_name ?? "Not set"}
              </div>
              <p className="text-xs text-[var(--text-muted)]">Sourced from the Australian Business Register. Contact support to update.</p>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">ABN</label>
              <input
                name="abn"
                defaultValue={businessRow?.abn ?? ""}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                placeholder="XX XXX XXX XXX"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Phone</label>
              <input
                name="phone"
                defaultValue={businessRow?.phone ?? ""}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                placeholder="0400 000 000"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={user.email ?? ""}
                readOnly
                disabled
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-muted)] cursor-not-allowed"
              />
              <p className="text-xs text-[var(--text-muted)]">Email cannot be changed here.</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                To update your login email, contact{' '}
                <a href="mailto:hello@servlo.com.au" className="text-blue-500 hover:underline">
                  hello@servlo.com.au
                </a>
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Street address</label>
              <input
                name="address"
                defaultValue={businessRow?.address ?? ""}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                placeholder="123 Main Street"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Suburb</label>
              <input
                name="suburb"
                defaultValue={(businessRow as { suburb?: string | null } | null)?.suburb ?? ""}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                placeholder="Suburb"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">State</label>
                <select
                  name="state"
                  defaultValue={(businessRow as { state?: string | null } | null)?.state ?? ""}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                >
                  <option value="">— State —</option>
                  {AU_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Postcode</label>
                <input
                  name="postcode"
                  defaultValue={(businessRow as { postcode?: string | null } | null)?.postcode ?? ""}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--product-accent)]"
                  placeholder="2000"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                Logo upload coming soon — contact{" "}
                <a href="mailto:hello@servlo.com.au" className="text-[var(--product-accent)] hover:underline">
                  hello@servlo.com.au
                </a>{" "}
                to update your logo.
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Shown on client-facing documents. The SERVLO logo always appears in the dashboard sidebar.</p>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-[var(--product-accent)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-accent-hover)]"
              >
                Save profile
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* ── Billing tab ──────────────────────────────────────────────────── */}
      {activeTab === "billing" ? (
        <div className="space-y-5">
          {isOnTrial && trialDaysRemaining !== null ? (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-amber-900 dark:text-amber-200">
                    {trialDaysRemaining === 0 ? "Your trial has ended" : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} remaining on your trial`}
                  </p>
                  <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">
                    {trialDaysRemaining === 0
                      ? "Choose a plan to keep your data and continue using SERVLO."
                      : "Upgrade now to keep uninterrupted access after your trial ends."}
                  </p>
                </div>
                <a
                  href="#plans"
                  className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
                >
                  View plans
                </a>
              </div>
            </Card>
          ) : null}

          <BillingTab
            currentPlan={currentPlan}
            isOnTrial={isOnTrial}
            email={user.email ?? ""}
            priceIds={{
              solo: process.env.STRIPE_SOLO_PRICE_ID ?? "price_1TTiL8K1tzStyRcJQAfbuJ5n",
              team: process.env.STRIPE_TEAM_PRICE_ID ?? "price_1TTiLaK1tzStyRcJNOgCeg0X",
              business: process.env.STRIPE_BUSINESS_PRICE_ID ?? "price_1TTiLyK1tzStyRcJ4BVJz0o8"
            }}
            success={resolvedParams?.success === "true"}
          />
        </div>
      ) : null}

      {/* ── Workspace tab ────────────────────────────────────────────────── */}
      {activeTab === "workspace" ? (
        <div className="space-y-5">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Brand colour</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Choose a preset accent colour applied to buttons, links and invoice accents across your dashboard.
            </p>
            <BrandAccentForm savedAccent={savedAccent} />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Applied to client-facing documents (invoices, quotes). Does not affect dashboard appearance.</p>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Workspace features</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Turn modules on or off for your workspace. The sidebar and dashboard update immediately after you save. Features marked{" "}
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-100">
                Recommended
              </span>{" "}
              match your industry defaults.
            </p>
            <form action={updateWorkspaceFeaturesAction} className="mt-4">
              {/* Group 1: Client & Job Management */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Client &amp; Job Management</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["jobs_scheduling", "appointments_scheduling", "client_management", "quotes", "recurring_jobs", "client_portal"] as const).map((id) => (
                    WORKSPACE_FEATURE_IDS.includes(id) ? (
                      <WorkspaceFeatureSwitch
                        key={id}
                        featureId={isOptionalFeatureId(id) ? id : undefined}
                        formName={isOptionalFeatureId(id) ? "feature" : undefined}
                        disabled={!isOptionalFeatureId(id)}
                        checked={!isOptionalFeatureId(id) ? true : undefined}
                        defaultChecked={isOptionalFeatureId(id) ? workspaceFeatures.has(id) : undefined}
                        label={
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{FEATURE_LABELS[id]}</span>
                            {isRecommendedFeatureForIndustry(id, primaryIndustry) ? (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:bg-teal-950 dark:text-teal-100">Recommended</span>
                            ) : null}
                          </span>
                        }
                        description={FEATURE_DESCRIPTIONS[id]}
                      />
                    ) : null
                  ))}
                </div>
              </div>
              {/* Group 2: Finance */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Finance</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["invoices", "purchase_orders"] as const).map((id) => (
                    WORKSPACE_FEATURE_IDS.includes(id) ? (
                      <WorkspaceFeatureSwitch
                        key={id}
                        featureId={isOptionalFeatureId(id) ? id : undefined}
                        formName={isOptionalFeatureId(id) ? "feature" : undefined}
                        disabled={!isOptionalFeatureId(id)}
                        checked={!isOptionalFeatureId(id) ? true : undefined}
                        defaultChecked={isOptionalFeatureId(id) ? workspaceFeatures.has(id) : undefined}
                        label={
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{FEATURE_LABELS[id]}</span>
                            {isRecommendedFeatureForIndustry(id, primaryIndustry) ? (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:bg-teal-950 dark:text-teal-100">Recommended</span>
                            ) : null}
                          </span>
                        }
                        description={FEATURE_DESCRIPTIONS[id]}
                      />
                    ) : null
                  ))}
                </div>
              </div>
              {/* Group 3: Team */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Team</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["employee_management", "timesheets", "contractors"] as const).map((id) => (
                    WORKSPACE_FEATURE_IDS.includes(id) ? (
                      <WorkspaceFeatureSwitch
                        key={id}
                        featureId={isOptionalFeatureId(id) ? id : undefined}
                        formName={isOptionalFeatureId(id) ? "feature" : undefined}
                        disabled={!isOptionalFeatureId(id)}
                        checked={!isOptionalFeatureId(id) ? true : undefined}
                        defaultChecked={isOptionalFeatureId(id) ? workspaceFeatures.has(id) : undefined}
                        label={
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{FEATURE_LABELS[id]}</span>
                            {isRecommendedFeatureForIndustry(id, primaryIndustry) ? (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:bg-teal-950 dark:text-teal-100">Recommended</span>
                            ) : null}
                          </span>
                        }
                        description={FEATURE_DESCRIPTIONS[id]}
                      />
                    ) : null
                  ))}
                </div>
              </div>
              {/* Group 4: Field Tools */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Field Tools</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["gps_clock", "job_photos", "equipment_hire"] as const).map((id) => (
                    WORKSPACE_FEATURE_IDS.includes(id) ? (
                      <WorkspaceFeatureSwitch
                        key={id}
                        featureId={isOptionalFeatureId(id) ? id : undefined}
                        formName={isOptionalFeatureId(id) ? "feature" : undefined}
                        disabled={!isOptionalFeatureId(id)}
                        checked={!isOptionalFeatureId(id) ? true : undefined}
                        defaultChecked={isOptionalFeatureId(id) ? workspaceFeatures.has(id) : undefined}
                        label={
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{FEATURE_LABELS[id]}</span>
                            {isRecommendedFeatureForIndustry(id, primaryIndustry) ? (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:bg-teal-950 dark:text-teal-100">Recommended</span>
                            ) : null}
                          </span>
                        }
                        description={FEATURE_DESCRIPTIONS[id]}
                      />
                    ) : null
                  ))}
                </div>
              </div>
              {/* Group 5: Growth & Marketing */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Growth &amp; Marketing</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["crm_pipeline", "email_marketing", "project_tracking"] as const).map((id) => (
                    WORKSPACE_FEATURE_IDS.includes(id) ? (
                      <WorkspaceFeatureSwitch
                        key={id}
                        featureId={isOptionalFeatureId(id) ? id : undefined}
                        formName={isOptionalFeatureId(id) ? "feature" : undefined}
                        disabled={!isOptionalFeatureId(id)}
                        checked={!isOptionalFeatureId(id) ? true : undefined}
                        defaultChecked={isOptionalFeatureId(id) ? workspaceFeatures.has(id) : undefined}
                        label={
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{FEATURE_LABELS[id]}</span>
                            {isRecommendedFeatureForIndustry(id, primaryIndustry) ? (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:bg-teal-950 dark:text-teal-100">Recommended</span>
                            ) : null}
                          </span>
                        }
                        description={FEATURE_DESCRIPTIONS[id]}
                      />
                    ) : null
                  ))}
                </div>
              </div>
              <div className="sticky bottom-0 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2235] p-4 -mx-6 -mb-6">
                <button
                  type="submit"
                  className="rounded-md bg-[var(--product-accent)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-accent-hover)]"
                >
                  Save features
                </button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {/* ── Notifications tab ────────────────────────────────────────────── */}
      {activeTab === "notifications" ? (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification preferences</h2>
          <p className="mt-1 mb-5 text-sm text-[var(--text-secondary)]">
            Choose which email notifications you receive from SERVLO.
          </p>
          <NotificationsForm
            initialPrefs={notifPrefs}
            saveAction={saveNotificationPrefsAction}
          />
        </Card>
      ) : null}

      {/* ── Import / Export tab ──────────────────────────────────────────── */}
      {activeTab === "import-export" ? (
        <ImportExportTab />
      ) : null}

      {/* ── Integrations tab ─────────────────────────────────────────────── */}
      {activeTab === "integrations" ? (
        <IntegrationsTab stripeConnected={stripeConnected} />
      ) : null}

      {/* ── Demo Data tab ────────────────────────────────────────────────── */}
      {activeTab === "demo-data" ? (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Demo data</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            On signup we add sample clients, jobs, quotes and invoices so the dashboard is not empty. These rows are tagged as demo,
            stay out of financial totals, and do not support billing emails or similar actions.
          </p>
          <details className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">What&apos;s included in demo data?</summary>
            <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)] list-disc list-inside">
              <li>5 sample clients with contact details</li>
              <li>10 sample jobs with notes and photos</li>
              <li>3 invoices in various states</li>
              <li>2 quotes ready to send</li>
              <li>3 employees with associated timesheets</li>
            </ul>
          </details>
          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            Demo records are clearly labelled with a badge and excluded from all financial totals and reports.
          </div>
          <div className="mt-5 space-y-4">
            <DemoDataButtons
              resetAction={resetDemoDataAction}
              removeAction={removeAllDemoDataAction}
            />
            <div className="pt-2">
              <ReseedDemoApiButton userId={user.id} />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              <strong>Seed demo data</strong> removes existing demo rows and inserts a fresh template set.{" "}
              <strong>Clear all</strong> deletes demo rows only and leaves your real data untouched.{" "}
              <strong>Reseed</strong> calls{" "}
              <code className="rounded bg-[var(--bg-secondary)] px-1 py-0.5 text-[11px]">POST /api/setup-business</code> with{" "}
              <code className="rounded bg-[var(--bg-secondary)] px-1 py-0.5 text-[11px]">demoOnly</code>, matching the signup seed path.
            </p>
          </div>
        </Card>
      ) : null}

      {/* ── Danger Zone tab ──────────────────────────────────────────────── */}
      {activeTab === "danger" ? (
        <div className="rounded-xl border-2 border-red-300 bg-[var(--bg-card)] p-6 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="mt-5">
            <DangerZoneTab
              businessName={businessRow?.business_name ?? ""}
              userEmail={user.email ?? ""}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
