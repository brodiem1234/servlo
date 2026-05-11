import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AdminBugQueue from "./admin-bug-queue";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "brodies.mcdonald@gmail.com";

export default async function AdminBugsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard/owner");

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

    // Enrich with owner info
    const bugData = data ?? [];
    const ownerIds = [...new Set(bugData.map(b => b.owner_id))];

    const ownerMap: Record<string, { email?: string; business?: string }> = {};

    if (ownerIds.length > 0) {
      const { data: bizData } = await admin
        .from("businesses")
        .select("owner_id, business_name")
        .in("owner_id", ownerIds);

      (bizData ?? []).forEach(b => {
        ownerMap[b.owner_id] = { business: b.business_name };
      });
    }

    bugs = bugData.map(b => ({
      ...b,
      owner_email: ownerMap[b.owner_id]?.email,
      owner_business: ownerMap[b.owner_id]?.business,
    }));
  } catch (err) {
    console.error("[admin/bugs] fetch failed:", err);
  }

  return <AdminBugQueue bugs={bugs} />;
}
