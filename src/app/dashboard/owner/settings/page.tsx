import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import SubscriptionCards from "./subscription-cards";

type SettingsPageProps = {
  searchParams?: {
    success?: string;
  };
};

export default async function OwnerSettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, abn, phone, address, plan, subscription_status, trial_end, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  const businessName = profile?.business_name ?? "SERVLO Business";
  const trialEnd = profile?.trial_end ?? null;
  const subscriptionTier = profile?.subscription_tier ?? "solo";

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

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Settings</h1>

      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Business Profile</h2>
        <form action={updateBusinessProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="business_name" defaultValue={profile?.business_name ?? businessName} className="h-10 rounded border px-3" placeholder="Business name" />
          <input name="abn" defaultValue={profile?.abn ?? ""} className="h-10 rounded border px-3" placeholder="ABN" />
          <input name="phone" defaultValue={profile?.phone ?? ""} className="h-10 rounded border px-3" placeholder="Phone" />
          <input name="address" defaultValue={profile?.address ?? ""} className="h-10 rounded border px-3" placeholder="Address" />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">Save Business Profile</button>
          </div>
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
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Account</h2>
        <form action={changePassword} className="mt-3 flex flex-col gap-3 sm:max-w-md">
          <input name="new_password" type="password" minLength={8} required className="h-10 rounded border px-3" placeholder="New password" />
          <button type="submit" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">Change Password</button>
        </form>
      </article>
    </section>
  );
}


