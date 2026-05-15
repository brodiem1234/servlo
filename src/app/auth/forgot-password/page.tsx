import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { authUrl } from "@/lib/auth/site-origin";
import { ArrowLeft } from "lucide-react";

/**
 * Forgot-password request handler. Returns the SAME success message
 * regardless of whether the email exists. Prevents user-existence leak
 * (attackers can't enumerate registered emails by submitting the form).
 *
 * Real errors (rate limit, network) still get logged server-side but the
 * user sees the generic message.
 */
async function requestReset(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/auth/forgot-password?error=Enter%20your%20email");
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

  const redirectTo = authUrl("/auth/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Log server-side so we can debug, but never surface to the user — that
  // would reveal whether the email exists in the DB.
  if (error) {
    console.warn("[forgot-password] resetPasswordForEmail error:", error.message);
  }

  // Always show the same success message. If the email exists, Supabase
  // sends the reset link. If it doesn't, nothing happens — but the attacker
  // can't tell the difference.
  redirect(
    `/auth/forgot-password?success=${encodeURIComponent(
      "If an account exists for that email, we've sent a reset link. Check your inbox."
    )}&email=${encodeURIComponent(email)}`
  );
}

type Props = {
  searchParams?: Promise<{ error?: string; success?: string; email?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const emailValue = sp.email ?? "";
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-10 sm:py-16 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white">
        <ArrowLeft size={15} />
        Back to homepage
      </Link>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-neutral-800 bg-[#111111] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:p-8">
        <div className="mb-6 flex justify-center">
          <Image src="/servlo-master-white.svg" alt="SERVLO" width={140} height={40} priority unoptimized
            className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-10 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {sp.success ? (
          <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{sp.success}</p>
        ) : null}
        {sp.error ? (
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{sp.error}</p>
        ) : null}

        <form action={requestReset} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-400">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={emailValue}
              required
              className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-white placeholder-zinc-500 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-100">
            Send reset link
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          <Link href="/auth/login" className="font-semibold text-white hover:text-neutral-300 transition">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
