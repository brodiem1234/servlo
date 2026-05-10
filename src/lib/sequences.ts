/**
 * Auto-number sequences for jobs, invoices, and quotes.
 * Format: JOB-0001, INV-0001, QT-0001
 * Numbers are per-owner and monotonically increase (count+1 strategy).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

function pad(n: number): string {
  return String(n).padStart(4, "0");
}

export async function getNextJobNumber(
  supabase: SupabaseClient,
  ownerId: string
): Promise<string> {
  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  return `JOB-${pad((count ?? 0) + 1)}`;
}

export async function getNextInvoiceNumber(
  supabase: SupabaseClient,
  ownerId: string
): Promise<string> {
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  return `INV-${pad((count ?? 0) + 1)}`;
}

export async function getNextQuoteNumber(
  supabase: SupabaseClient,
  ownerId: string
): Promise<string> {
  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  return `QT-${pad((count ?? 0) + 1)}`;
}
