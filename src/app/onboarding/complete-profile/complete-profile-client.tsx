"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { retryCompleteProfileSetup } from "./actions";
import type { CompleteProfileState } from "./state";

const initial: CompleteProfileState = { error: null };

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] sm:w-auto" disabled={pending}>
      {pending ? "Retrying…" : "Retry setup"}
    </Button>
  );
}

type Props = {
  flash: string | null;
  signedIn: boolean;
  email: string | null;
};

export function CompleteProfileClient({ flash, signedIn, email }: Props) {
  const [state, formAction] = useFormState(retryCompleteProfileSetup, initial);

  const banner = state.error ?? flash;

  return (
    <main className="auth-theme flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-16">
      <div className="auth-card mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-white">Finish setting up your account</h1>
        <p className="mt-2 text-sm text-slate-400">
          If signup stopped early, retry completes your profile and business record (brand colour and demo data). Sign in first if this isn&apos;t your device.
        </p>

        {email ? (
          <p className="mt-4 text-sm text-slate-300">
            Signed in as <span className="font-medium text-white">{email}</span>
          </p>
        ) : null}

        {banner ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200 whitespace-pre-wrap break-words">
            {banner}
          </p>
        ) : null}

        {signedIn ? (
          <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <RetryButton />
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <Button asChild className="w-full bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] sm:w-auto">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <p className="text-sm text-slate-400">
              After signing in, open this page again or tap Retry from your signup confirmation email flow.
            </p>
          </div>
        )}

        <p className="mt-8 text-sm text-slate-400">
          Wrong place?{" "}
          <Link href="/auth/signup" className="font-semibold text-[var(--accent-color)] hover:underline">
            Back to signup
          </Link>
        </p>
      </div>
    </main>
  );
}
