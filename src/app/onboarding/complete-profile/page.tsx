import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_FLASH_COOKIE } from "@/lib/onboarding-flash-constants";
import { CompleteProfileClient } from "./complete-profile-client";

export default async function CompleteProfilePage() {
  const jar = await cookies();
  const flash = jar.get(ONBOARDING_FLASH_COOKIE)?.value ?? null;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <CompleteProfileClient flash={flash} signedIn={Boolean(user)} email={user?.email ?? null} />;
}
