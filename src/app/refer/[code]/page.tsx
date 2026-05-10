import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

/** Canonical referral URL uses /ref/[code]; this path just redirects for compatibility. */
export default async function ReferRedirectPage({ params }: Props) {
  const { code } = await params;
  redirect(`/ref/${encodeURIComponent(code)}`);
}
