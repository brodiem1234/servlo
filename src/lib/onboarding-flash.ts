import { cookies } from "next/headers";
import { ONBOARDING_FLASH_COOKIE } from "@/lib/onboarding-flash-constants";

export { ONBOARDING_FLASH_COOKIE };

/** Short-lived flash shown on `/onboarding/complete-profile` (avoid putting errors in the URL). */
export async function setOnboardingFlashMessage(message: string) {
  const jar = await cookies();
  jar.set(ONBOARDING_FLASH_COOKIE, message.slice(0, 3500), {
    path: "/",
    maxAge: 300,
    sameSite: "lax",
    httpOnly: true
  });
}
