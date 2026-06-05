import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasActivePaidSubscription } from "@/lib/billing/subscription-access";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "Please sign in to access the dashboard");
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const isBillingRecoveryPath =
      request.nextUrl.pathname.startsWith("/dashboard/upgrade") ||
      request.nextUrl.pathname.startsWith("/dashboard/billing");

    if (
      profile?.role === "owner" &&
      !isBillingRecoveryPath &&
      !hasActivePaidSubscription(profile)
    ) {
      const upgradeUrl = new URL("/dashboard/upgrade", request.url);
      upgradeUrl.searchParams.set("reason", "subscription_required");
      return NextResponse.redirect(upgradeUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"]
};


