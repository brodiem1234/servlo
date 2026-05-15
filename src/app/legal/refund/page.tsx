import { redirect } from "next/navigation";

/**
 * Legacy /legal/refund URL — redirects to the canonical /refund route.
 * The next.config.mjs redirect block handles this at the edge as well; this
 * server-side redirect is a fallback in case that config is ever lost.
 */
export default function LegacyLegalRefundPage() {
  redirect("/refund");
}
