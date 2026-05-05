import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
  };
};

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/auth/login?error=Invalid%20email%20or%20password");
  }

  redirect("/dashboard/owner");
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-sky-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-sky-950">Sign in to SERVLO</h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome back. Access your dashboard and continue managing your business.
        </p>

        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        ) : null}
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
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-sky-200 focus:ring-2"
            />
          </div>
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

