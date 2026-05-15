import { redirect } from "next/navigation";

/**
 * Legacy /legal/privacy URL — redirects to the canonical /privacy route.
 * The next.config.mjs redirect block handles this at the edge as well; this
 * server-side redirect is a fallback in case that config is ever lost.
 */
export default function LegacyLegalPrivacyPage() {
  redirect("/privacy");
}
