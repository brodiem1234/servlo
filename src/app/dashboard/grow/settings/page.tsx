import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GrowSettingsClient from "./grow-settings-client";

export const metadata = { title: "SERVLO GROW — Settings" };

export default async function GrowSettingsPage() {
  let business = null;
  let profile = null;
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const [bizResult, profResult] = await Promise.all([
      supabase.from("businesses").select("*").eq("owner_id", user.id).single(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    business = bizResult.data;
    profile = profResult.data;
  } catch {}

  return <GrowSettingsClient business={business} profile={profile} />;
}
