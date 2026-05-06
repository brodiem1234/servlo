import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
    email?: string;
  };
};

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember_me") === "on";

  const cookieStore = await cookies();
  const oneYear = 60 * 60 * 24 * 365;
  const cookieBase = {
    path: "/" as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };

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
        }
      },
      cookieOptions: {
        ...cookieBase,
        maxAge: rememberMe ? oneYear : undefined
      }
    }
  );

  // Session lifetime on this SSR client comes from cookieOptions.maxAge above (browser-session cookie when unchecked).
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const rawMessage = error?.message ?? "Unable to sign in";
    const lowerMessage = rawMessage.toLowerCase();
    let message = rawMessage;
    if (lowerMessage.includes("invalid login credentials")) {
      message = "Incorrect email or password";
    } else if (lowerMessage.includes("user not found") || lowerMessage.includes("email not found")) {
      message = "Account not found";
    } else if (lowerMessage.includes("email not confirmed")) {
      message = "Please verify your email before logging in";
    }

    const query = new URLSearchParams({
      error: message,
      email
    });
    redirect(`/auth/login?${query.toString()}`);
  }

  cookieStore.set("servlo_persist_session", rememberMe ? "true" : "false", {
    path: "/",
    maxAge: oneYear,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  if (rememberMe) {
    cookieStore.set("servlo_remember_email", email, {
      path: "/",
      maxAge: oneYear,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  } else {
    cookieStore.delete("servlo_remember_email");
  }

  redirect("/dashboard/owner");
}

import { ThemeToggleCorner } from "@/components/theme-toggle-corner";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const rememberedEmail = cookieStore.get("servlo_remember_email")?.value ?? "";
  /** Default on unless user explicitly chose not to remember. */
  const rememberMeChecked = cookieStore.get("servlo_persist_session")?.value !== "false";
  const emailValue = searchParams?.email ?? rememberedEmail;

  return (
    <>
      <ThemeToggleCorner />
      <main className="auth-theme relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-16">
      <div className="auth-card mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <Image src="/logo.png" alt="SERVLO" width={64} height={64} />
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Welcome back. Access your dashboard and continue managing your business.
        </p>

        {searchParams?.success ? (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {searchParams.success}
          </p>
        ) : null}

        <form action={signIn} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={emailValue}
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              name="remember_me"
              type="checkbox"
              defaultChecked={rememberMeChecked}
              className="h-4 w-4 rounded border-slate-300 text-[var(--accent-color)]"
            />
            Remember me
          </label>
          {searchParams?.error ? (
            <p className="text-sm text-red-700">{searchParams.error}</p>
          ) : null}
          <Button type="submit" className="w-full bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)]">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          New to SERVLO?{" "}
          <Link href="/auth/signup" className="font-semibold text-[var(--accent-color)] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
    </>
  );
}


