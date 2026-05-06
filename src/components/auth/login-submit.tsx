"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-[var(--accent-color)] text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

