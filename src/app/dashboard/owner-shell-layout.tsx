import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import OwnerShell from "./owner/owner-shell";
import { filterOwnerNavSections, OWNER_NAV_SECTIONS } from "./owner/nav-config";
import { isIndustrySlug, type IndustrySlug } from "@/lib/industries";
import { loadWorkspaceFeatureSet, schedulingEnabled } from "@/lib/workspace-features";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

/** Shared wrapper for owner-facing routes that use the sidebar shell (owner home + contractors, etc.). */
export default async function DashboardOwnerShellLayout({ children }: { children: React.ReactNode }) {
  const { user, businessName } = await getOwnerContext();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const [{ data: profileRow }, invRes, quoteRes, tasksRes, notifRes] = await Promise.all([
    supabase.from("profiles").select("industry_tags, onboarding_dismissed, onboarding_completed, tour_completed").eq("id", user.id).maybeSingle(),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date")
      .eq("owner_id", user.id)
      .eq("status", "unpaid")
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("quotes")
      .select("id, quote_number, created_at, status")
      .eq("owner_id", user.id)
      .in("status", ["sent", "pending"])
      .order("created_at", { ascending: true })
      .limit(20),
    supabase
      .from("owner_tasks")
      .select("id, title, done")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(80),
    supabase
      .from("notifications")
      .select("id, message, type, read_at")
      .eq("owner_id", user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const industryTags = Array.isArray((profileRow as { industry_tags?: unknown } | null)?.industry_tags)
    ? ((profileRow as { industry_tags: string[] }).industry_tags ?? []).filter((t): t is IndustrySlug => isIndustrySlug(t))
    : [];

  // Onboarding tour state: treat old onboarding_completed as dismissed too (back-compat)
  const onboardingDismissed =
    Boolean((profileRow as { onboarding_dismissed?: boolean } | null)?.onboarding_dismissed) ||
    Boolean((profileRow as { onboarding_completed?: boolean } | null)?.onboarding_completed);
  const tourCompleted = Boolean(
    (profileRow as { tour_completed?: boolean } | null)?.tour_completed
  );

  const enabledFeatures = await loadWorkspaceFeatureSet(supabase, user.id, industryTags);
  const filteredNav = filterOwnerNavSections(OWNER_NAV_SECTIONS, enabledFeatures);

  const shortcutTargets = {
    jobs: schedulingEnabled(enabledFeatures),
    clients: enabledFeatures.has("client_management"),
    invoices: enabledFeatures.has("invoices"),
    quotes: enabledFeatures.has("quotes")
  };

  const unpaidInvoices = invRes.data;
  const followUpQuotesRaw = quoteRes.data;
  const taskRows = tasksRes.error ? [] : tasksRes.data ?? [];

  const followUpQuotes = followUpQuotesRaw ?? [];

  const alerts = [
    ...(notifRes.data ?? []).map((n) => ({
      id: `notif-${n.id}`,
      text: n.message as string
    })),
    ...(unpaidInvoices ?? []).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      text: `Invoice ${invoice.invoice_number ?? "unpaid"} needs follow-up`
    })),
    ...followUpQuotes
      .filter((quote) => {
        if (!quote.created_at) return false;
        const ageDays = Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return ageDays >= 3;
      })
      .map((quote) => ({
        id: `quote-${quote.id}`,
        text: `Quote ${quote.quote_number ?? "pending"} awaiting acceptance (${Math.max(
          0,
          Math.floor((Date.now() - new Date(quote.created_at as string).getTime()) / (1000 * 60 * 60 * 24))
        )} days)`
      }))
  ].slice(0, 8);

  return (
    <OwnerShell
      businessName={businessName}
      signOutAction={signOut}
      alerts={alerts}
      initialTasks={taskRows.map((t) => ({
        id: t.id,
        title: t.title,
        done: Boolean(t.done)
      }))}
      navSections={filteredNav}
      shortcutTargets={shortcutTargets}
      initialOnboardingDismissed={onboardingDismissed}
      initialTourCompleted={tourCompleted}
    >
      {children}
    </OwnerShell>
  );
}
