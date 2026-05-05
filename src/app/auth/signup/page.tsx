import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

const TRADE_TYPES = [
  "Electrician",
  "Plumber",
  "Builder",
  "Carpenter",
  "HVAC",
  "Painter",
  "Landscaper",
  "Other"
];

type SignupPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
  };
};

async function signUp(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const tradeType = String(formData.get("trade_type") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "owner").trim();
  const role = roleInput === "client" ? "client" : "owner";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        business_name: businessName,
        abn,
        phone_number: phoneNumber,
        trade_type: tradeType,
        role
      }
    }
  });

  if (error || !data.user) {
    console.error("Signup auth error", {
      error,
      hasUser: Boolean(data?.user),
      hasSession: Boolean(data?.session),
      email
    });
    redirect("/auth/signup?error=Unable%20to%20create%20account");
  }

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let profileError: Error | null = null;
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: name,
        email,
        phone: phoneNumber,
        business_name: businessName,
        abn,
        role,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        subscription_status: "trialing",
        subscription_tier: "solo"
      },
      { onConflict: "id" }
    );
    profileError = error;
  } catch {
    console.error("Signup profile insert threw before query", {
      email,
      userId: data.user.id
    });
    profileError = new Error("Service role client is not configured");
  }

  if (profileError) {
    console.error("Signup profile insert error", {
      error: profileError,
      email,
      userId: data.user.id,
      payload: {
        id: data.user.id,
        full_name: name,
        email,
        phone: phoneNumber,
        business_name: businessName,
        abn,
        role,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        subscription_status: "trialing",
        subscription_tier: "solo"
      }
    });
    redirect("/auth/signup?error=Account%20created%20but%20profile%20setup%20failed");
  }

  redirect(role === "client" ? "/dashboard/client" : "/dashboard/owner");
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <main className="auth-theme flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-16">
      <div className="auth-card mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <Image src="/logo.png" alt="SERVLO" width={64} height={64} />
        </div>
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Create your account</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Start your 30 day free trial and set up your business in minutes.
        </p>

        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        ) : null}

        <form action={signUp} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-[#1e3a5f]">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="owner"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            >
              <option value="owner">Business (Tradie)</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-[#1e3a5f]">
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#1e3a5f]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#1e3a5f]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            />
          </div>
          <div>
            <label
              htmlFor="business_name"
              className="mb-1 block text-sm font-medium text-[#1e3a5f]"
            >
              Business name
            </label>
            <input
              id="business_name"
              name="business_name"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            />
          </div>
          <div>
            <label htmlFor="abn" className="mb-1 block text-sm font-medium text-[#1e3a5f]">
              ABN
            </label>
            <input
              id="abn"
              name="abn"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            />
          </div>
          <div>
            <label
              htmlFor="phone_number"
              className="mb-1 block text-sm font-medium text-[#1e3a5f]"
            >
              Phone number
            </label>
            <input
              id="phone_number"
              name="phone_number"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="trade_type"
              className="mb-1 block text-sm font-medium text-[#1e3a5f]"
            >
              Trade type
            </label>
            <select
              id="trade_type"
              name="trade_type"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-[#1e3a5f]"
              defaultValue=""
            >
              <option value="" disabled>
                Select your trade
              </option>
              {TRADE_TYPES.map((tradeType) => (
                <option key={tradeType} value={tradeType}>
                  {tradeType}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 sm:col-span-2">
            <Button type="submit" className="w-full bg-[#0db8c8] text-white hover:bg-[#0a9dab]">
              Create account
            </Button>
          </div>
        </form>

        <p className="mt-5 text-sm text-[#64748b]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#1e3a5f] hover:text-[#0db8c8]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}


