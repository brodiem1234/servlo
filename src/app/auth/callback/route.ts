import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auth callback for OAuth + magic-link + email-confirm flows.
 *
 * Improvements over previous version:
 *  - Inspects exchangeCodeForSession error and routes user to a friendly
 *    login error page instead of dumping them at /dashboard/owner.
 *  - Routes by role: owners → /dashboard/owner, employees → /dashboard/employee,
 *    clients → /dashboard/client.
 *  - Returns a 400-style redirect with the error message if the code is missing
 *    or invalid (was silently redirecting before).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=Missing+authentication+code", origin)
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !exchanged?.session?.user) {
    console.error("[auth/callback] exchange failed:", error?.message);
    const msg = error?.message ?? "We couldn't complete sign in. Try again.";
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(msg)}`, origin)
    );
  }

  // Look up role to decide landing surface.
  let destination = "/dashboard/owner";
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", exchanged.session.user.id)
      .maybeSingle();

    const role = (profile as { role?: string | null } | null)?.role;
    if (role === "employee") destination = "/dashboard/employee";
    else if (role === "client") destination = "/dashboard/client";
    // Owners + admins both land on the owner workspace.
  } catch (lookupErr) {
    console.warn("[auth/callback] role lookup failed, defaulting to owner:", lookupErr);
  }

  return NextResponse.redirect(new URL(destination, origin));
}
