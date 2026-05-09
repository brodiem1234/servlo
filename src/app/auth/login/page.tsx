import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { LoginExperience } from "@/components/auth/login-experience";

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

  redirect("/dashboard");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const rememberedEmail = cookieStore.get("servlo_remember_email")?.value ?? "";
  /** Default on unless user explicitly chose not to remember. */
  const rememberMeChecked = cookieStore.get("servlo_persist_session")?.value !== "false";
  const emailValue = searchParams?.email ?? rememberedEmail;

  return (
    <>
      <ThemeToggleCorner />
      <LoginExperience
        emailValue={emailValue}
        rememberMeChecked={rememberMeChecked}
        signInAction={signIn}
        flashError={searchParams?.error}
        flashSuccess={searchParams?.success}
      />
    </>
  );
}


