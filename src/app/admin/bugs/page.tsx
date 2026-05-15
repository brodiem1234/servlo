import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import AdminBugQueue from "./admin-bug-queue";

export const dynamic = "force-dynamic";

export default async function AdminBugsPage() {
  // Role-based admin guard — replaces the hardcoded email check.
  // Centralised in require-admin so adding new admins is a single DB update.
  await requireAdmin();

  const admin = createAdminClient();

  let bugs: Array<{
    id: string;
    owner_id: string;
    title: string;
    description: string;
    page_url: string | null;
    severity: string;
    status: string;
    free_month_awarded: boolean;
    admin_notes: string | null;
    screenshot_url: string | null;
    created_at: string;
    resolved_at: string | null;
    owner_email?: string;
    owner_business?: string;
  }> = [];

  try {
    const { data } = await admin
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    const bugData = data ?? [];
    const ownerIds = [...new Set(bugData.map((b) => b.owner_id))];

    const ownerMap: Record<string, { email?: string; business?: string }> = {};

    if (ownerIds.length > 0) {
      // Business name (from businesses table)
      const { data: bizData } = await admin
        .from("businesses")
        .select("owner_id, business_name")
        .in("owner_id", ownerIds);

      (bizData ?? []).forEach((b) => {
        ownerMap[b.owner_id] = { ...ownerMap[b.owner_id], business: b.business_name };
      });

      // Email (from profiles.email — was never populated before, now is)
      const { data: profileData } = await admin
        .from("profiles")
        .select("id, email")
        .in("id", ownerIds);

      (profileData ?? []).forEach((p) => {
        const profile = p as { id: string; email?: string | null };
        ownerMap[profile.id] = {
          ...ownerMap[profile.id],
          email: profile.email ?? undefined,
        };
      });
    }

    bugs = bugData.map((b) => ({
      ...b,
      owner_email: ownerMap[b.owner_id]?.email,
      owner_business: ownerMap[b.owner_id]?.business,
    }));
  } catch (err) {
    console.error("[admin/bugs] fetch failed:", err);
  }

  return <AdminBugQueue bugs={bugs} />;
}
