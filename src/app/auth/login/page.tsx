import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const rawMessage = error?.message ?? "Unable to sign in";
    const lowerMessage = rawMessage.toLowerCase();
    let message = rawMessage;
    if (lowerMessage.includes("invalid login credentials")) {
      message = "Incorrect email or password";
    } else if (lowerMessage.includes("email not confirmed")) {
      message = "Please verify your email before logging in";
    }

    const query = new URLSearchParams({
      error: message,
      email
    });
    redirect(`/auth/login?${query.toString()}`);
  }

  const cookieStore = await cookies();
  if (rememberMe) {
    const oneYear = 60 * 60 * 24 * 365;
    cookieStore.set("servlo_remember_email", email, {
      path: "/",
      maxAge: oneYear,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    cookieStore.set("servlo_remember_password", password, {
      path: "/",
      maxAge: oneYear,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    cookieStore.set("servlo_persist_session", "true", {
      path: "/",
      maxAge: oneYear,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  } else {
    cookieStore.delete("servlo_remember_email");
    cookieStore.delete("servlo_remember_password");
    cookieStore.delete("servlo_persist_session");
  }

  redirect("/dashboard/owner");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const rememberedEmail = cookieStore.get("servlo_remember_email")?.value ?? "";
  const rememberedPassword = cookieStore.get("servlo_remember_password")?.value ?? "";
  const rememberedChecked = cookieStore.get("servlo_persist_session")?.value === "true";
  const emailValue = searchParams?.email ?? rememberedEmail;

  return (
    <main className="min-h-screen bg-sky-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-sky-950">Sign in to SERVLO</h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome back. Access your dashboard and continue managing your business.
        </p>

        {searchParams?.success ? (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {searchParams.success}
          </p>
        ) : null}

        <form action={signIn} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={emailValue}
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-sky-200 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue={rememberedPassword}
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-sky-200 focus:ring-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              name="remember_me"
              type="checkbox"
              defaultChecked={rememberedChecked}
              className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
            />
            Remember me
          </label>
          {searchParams?.error ? (
            <p className="text-sm text-red-700">{searchParams.error}</p>
          ) : null}
          <Button type="submit" className="w-full bg-sky-700 hover:bg-sky-800">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          New to SERVLO?{" "}
          <Link href="/auth/signup" className="font-semibold text-sky-700 hover:text-sky-800">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}


