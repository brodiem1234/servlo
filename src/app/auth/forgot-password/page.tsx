import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { authUrl } from "@/lib/auth/site-origin";

async function requestReset(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/auth/forgot-password?error=Enter%20your%20email");

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
        }
      }
    }
  );

  const redirectTo = authUrl("/auth/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}&email=${encodeURIComponent(email)}`);
  }
  redirect(`/auth/forgot-password?success=${encodeURIComponent("Check your email for a reset link.")}&email=${encodeURIComponent(email)}`);
}

type Props = {
  searchParams?: { error?: string; success?: string; email?: string };
};

export default function ForgotPasswordPage({ searchParams }: Props) {
  const emailValue = searchParams?.email ?? "";
  return (
    <>
      <ThemeToggleCorner />
      <main className="auth-theme relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-16">
        <div className="auth-card mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <Image src="/servlo-master-dark.svg" alt="SERVLO" width={140} height={36} priority unoptimized
              className="block dark:hidden drop-shadow-[0_0_32px_rgba(0,0,0,0.35)]" />
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={140} height={36} priority unoptimized
              className="hidden dark:block drop-shadow-[0_0_28px_rgba(59,130,246,0.55)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reset your password</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Enter your email and we’ll send a reset link.
          </p>

          {searchParams?.success ? (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.success}</p>
          ) : null}
          {searchParams?.error ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
          ) : null}

          <form action={requestReset} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={emailValue}
                required
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
              />
            </div>
            <Button type="submit" className="w-full bg-[var(--accent-color)] text-white transition hover:bg-[var(--accent-hover)]">
              Send reset link
            </Button>
          </form>

          <p className="mt-5 text-sm text-[var(--text-secondary)]">
            <Link href="/auth/login" className="font-semibold text-[var(--accent-color)] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

