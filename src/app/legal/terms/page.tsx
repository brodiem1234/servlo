import { redirect } from "next/navigation";

/**
 * Legacy /legal/terms URL — redirects to the canonical /terms route.
 * The next.config.mjs redirect block handles this at the edge as well; this
 * server-side redirect is a fallback in case that config is ever lost.
 */
export default function LegacyLegalTermsPage() {
  redirect("/terms");
}
