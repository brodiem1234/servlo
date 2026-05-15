import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { InviteAcceptClient } from "./invite-accept-client";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // Fetch invitation with business and owner details
  const { data: invitation } = await admin
    .from("team_invitations")
    .select("id, invited_email, role, status, expires_at, business_id, invited_by_user_id")
    .eq("invite_token", token)
    .single();

  // Check if current user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const loggedInEmail = user?.email;

  // Not found
  if (!invitation) {
    return (
      <ErrorPage title="Invitation not found" description="This invitation link is invalid or has already been used." />
    );
  }

  const inv = invitation as {
    id: string;
    invited_email: string;
    role: string;
    status: string;
    expires_at: string;
    business_id: string;
    invited_by_user_id: string;
  };

  // Expired
  const isExpired = inv.status === "expired" || new Date(inv.expires_at) < new Date();
  if (isExpired) {
    // Get business name for the message
    const { data: biz } = await admin
      .from("businesses")
      .select("business_name")
      .eq("id", inv.business_id)
      .maybeSingle();
    const bizName = (biz as { business_name?: string | null } | null)?.business_name ?? "this business";
    return (
      <ErrorPage
        title="Invitation expired"
        description={`This invitation to join ${bizName} has expired. Ask your team owner to send a new invitation.`}
      />
    );
  }

  // Already accepted/cancelled
  if (inv.status !== "pending") {
    return (
      <ErrorPage
        title="Invitation no longer valid"
        description="This invitation has already been used or cancelled."
      />
    );
  }

  // Get business and owner details
  const { data: business } = await admin
    .from("businesses")
    .select("business_name")
    .eq("id", inv.business_id)
    .maybeSingle();

  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", inv.invited_by_user_id)
    .maybeSingle();

  const businessName = (business as { business_name?: string | null } | null)?.business_name ?? "Unknown Business";
  const ownerName = (ownerProfile as { full_name?: string | null } | null)?.full_name ?? "Your team owner";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#0A0A0A" }}>
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#111111] p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 text-center">
          <span className="text-3xl font-black tracking-tight text-white">
            SERVLO
          </span>
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Team invitation
        </h1>

        <InviteAcceptClient
          token={token}
          invitedEmail={inv.invited_email}
          businessName={businessName}
          ownerName={ownerName}
          role={inv.role}
          isLoggedIn={!!user && user.email === inv.invited_email}
          loggedInEmail={loggedInEmail}
        />

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function ErrorPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0f1e" }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-8 text-center shadow-xl">
        <div className="mb-4 text-4xl">🔗</div>
        <h1 className="mb-2 text-xl font-bold text-white">{title}</h1>
        <p className="text-slate-400">{description}</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
