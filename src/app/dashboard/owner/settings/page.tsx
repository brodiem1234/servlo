import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAllDemoForOwner, seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { normalizeAccentColour } from "@/lib/brand-accent";
import { BrandAccentSwatches } from "@/components/brand-accent-swatches";
import SubscriptionCards from "./subscription-cards";
import { businessesOwnerOrEq, businessesRowForOwner } from "@/lib/businesses";

type SettingsPageProps = {
  searchParams?: {
    success?: string;
    demo?: string;
    demo_msg?: string;
  };
};

export default async function OwnerSettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: businessRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("business_name, abn, phone, address, plan, subscription_status, trial_end, subscription_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("businesses").select("accent_colour").or(businessesOwnerOrEq(user.id)).maybeSingle()
  ]);

  const businessName = profile?.business_name ?? "SERVLO Business";
  const trialEnd = profile?.trial_end ?? null;
  const subscriptionTier = profile?.subscription_tier ?? "solo";
  const savedAccent = normalizeAccentColour(businessRow?.accent_colour);

  const trialDaysRemaining = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  async function updateBusinessProfile(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    await sb
      .from("profiles")
      .update({
        business_name: String(formData.get("business_name") ?? ""),
        abn: String(formData.get("abn") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? "")
      })
      .eq("id", owner.id);
    revalidatePath("/dashboard/owner/settings");
    revalidatePath("/dashboard/owner");
  }

  async function updateBrandAccent(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const accent_colour = normalizeAccentColour(String(formData.get("accent_colour") ?? ""));
    const { error } = await sb.from("businesses").upsert(businessesRowForOwner(owner.id, { accent_colour }), {
      onConflict: "owner_id"
    });
    if (error) {
      console.error("[settings] brand accent upsert failed", error);
    }
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
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Settings</h1>

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
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Business Profile</h2>
        <form action={updateBusinessProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="business_name" defaultValue={profile?.business_name ?? businessName} className="h-10 rounded border px-3" placeholder="Business name" />
          <input name="abn" defaultValue={profile?.abn ?? ""} className="h-10 rounded border px-3" placeholder="ABN" />
          <input name="phone" defaultValue={profile?.phone ?? ""} className="h-10 rounded border px-3" placeholder="Phone" />
          <input name="address" defaultValue={profile?.address ?? ""} className="h-10 rounded border px-3" placeholder="Address" />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">Save Business Profile</button>
          </div>
        </form>
      </article>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Brand Colour</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose one of the preset brand accents — safe contrast on buttons, sidebar highlights and links across your dashboard.
        </p>
        <form action={updateBrandAccent} className="mt-4 space-y-4">
          <BrandAccentSwatches key={savedAccent} name="accent_colour" defaultValue={savedAccent} />
          <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">
            Save brand colour
          </button>
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
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Demo data</h2>
        <p className="mt-2 text-sm text-slate-600">
          On signup we add sample clients, jobs, quotes and invoices so the dashboard is not empty. These rows are tagged as demo,
          stay out of financial totals where noted, and do not support billing emails or similar actions.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={resetDemoDataAction}>
            <button
              type="submit"
              className="rounded border border-[#1e3a5f] bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-slate-50"
            >
              Reset Demo Data
            </button>
          </form>
          <form action={removeAllDemoDataAction}>
            <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
              Remove All Demo Data
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Reset removes existing demo rows and inserts a fresh template set. Remove deletes demo rows only and leaves your real data untouched.
        </p>
      </article>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Account</h2>
        <form action={changePassword} className="mt-3 flex flex-col gap-3 sm:max-w-md">
          <input name="new_password" type="password" minLength={8} required className="h-10 rounded border px-3" placeholder="New password" />
          <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">Change Password</button>
        </form>
      </article>
    </section>
  );
}


