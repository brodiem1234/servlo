/**
 * Admin guard for server components and API routes.
 * Checks that the current user has role = 'admin'.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Use in server components — redirects to /dashboard if not admin.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard/owner");
  }

  return { userId: user.id };
}

/**
 * Use in API routes — returns null if allowed, or a 403 response.
 */
export async function checkAdminAccess(): Promise<{ userId: string } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") return null;

    return { userId: user.id };
  } catch {
    return null;
  }
}
