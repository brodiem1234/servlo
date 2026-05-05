import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import OwnerShell from "./owner-shell";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, businessName } = await getOwnerContext();

  if (!user) {
    redirect("/auth/login");
  }

  return <OwnerShell businessName={businessName} signOutAction={signOut}>{children}</OwnerShell>;
}

