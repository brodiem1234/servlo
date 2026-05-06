import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import OwnerShell from "./owner/owner-shell";

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
  const [{ data: unpaidInvoices }, { data: followUpQuotes }] = await Promise.all([
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
      .neq("status", "accepted")
      .order("created_at", { ascending: true })
      .limit(5)
  ]);

  const alerts = [
    ...(unpaidInvoices ?? []).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      text: `Invoice ${invoice.invoice_number ?? "unpaid"} needs follow-up`
    })),
    ...((followUpQuotes ?? [])
      .filter((quote) => {
        if (!quote.created_at) return false;
        const ageDays = Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return ageDays >= 3;
      })
      .map((quote) => ({
        id: `quote-${quote.id}`,
        text: `Quote ${quote.quote_number ?? "pending"} needs follow-up`
      })))
  ].slice(0, 8);

  return (
    <OwnerShell businessName={businessName} signOutAction={signOut} alerts={alerts}>
      {children}
    </OwnerShell>
  );
}
