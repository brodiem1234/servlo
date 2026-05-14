#!/usr/bin/env node
/**
 * scripts/reset-test-data.mjs
 *
 * Wipes ALL test customer data from Supabase + Stripe test mode.
 *
 * SAFETY:
 *   - Refuses to run unless STRIPE_SECRET_KEY starts with "sk_test_"
 *   - --dry-run prints counts of what WOULD be deleted; no writes
 *   - Without --dry-run, requires the user to have explicitly invoked it
 *
 * PRESERVES:
 *   - Stripe products, prices, coupons (incl. EARLYACCESS), webhooks
 *   - Supabase schema + migrations (only data is deleted, not structure)
 *   - Config tables: plan_limits, plan_ai_limits, pricebook_templates
 *
 * USAGE:
 *   node scripts/reset-test-data.mjs --dry-run
 *   node scripts/reset-test-data.mjs            # destructive, real wipe
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ── Load .env.local ─────────────────────────────────────────────────────────
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const DRY_RUN = process.argv.includes("--dry-run");

// ── SAFETY CHECK 1: Stripe must be in TEST mode ────────────────────────────
const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
if (!stripeKey.startsWith("sk_test_")) {
  console.error("");
  console.error("REFUSED. STRIPE_SECRET_KEY is not a test-mode key.");
  console.error(`  Expected prefix:  sk_test_`);
  console.error(`  Actual prefix:    ${stripeKey.slice(0, 8) || "(empty)"}`);
  console.error("  Refusing to run; this script only works in test mode.");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const stripe = new Stripe(stripeKey);

// ── Tables to PRESERVE (config/reference data) ─────────────────────────────
const PRESERVE_TABLES = new Set([
  "plan_limits",
  "plan_ai_limits",
  "pricebook_templates",
]);

// ── Tables to WIPE (all user/business data) ────────────────────────────────
// Order roughly child-first for non-cascading FKs.
const WIPE_TABLES = [
  // Job-related children
  "invoice_payments",
  "job_materials",
  "job_events",
  "job_photos",
  "job_surveys",
  "job_follow_up_queue",
  "job_automation_log",
  "job_automations",
  "job_templates",
  "purchase_order_items",
  "purchase_orders",
  "timesheet_entries",
  "timesheets",
  "compliance_submissions",
  "compliance_documents",
  "compliance_forms",
  "client_notes",
  "client_properties",
  "client_enquiries",
  "quotes",
  "invoices",
  "jobs",
  "clients",
  "pricebook_items",
  // Communications
  "email_messages",
  "email_threads",
  "sms_messages",
  "notifications",
  "owner_notifications",
  "owner_tasks",
  "team_invitations",
  "call_logs",
  // Grow
  "grow_campaigns",
  "grow_social_posts",
  "grow_review_responses",
  "grow_referrals",
  "grow_ad_campaigns",
  "social_posts",
  "reviews",
  "campaigns",
  "referrals",
  // Leads
  "leads_accepted",
  "lead_pipeline",
  "marketplace_leads",
  "leads_marketplace",
  "lead_alert_preferences",
  // Connect
  "connect_posts",
  // Fleet / vehicles
  "vehicle_trips",
  "vehicle_service_records",
  "vehicles",
  // Finance
  "expense_claims",
  "bank_transactions",
  "bas_lodgements",
  "payment_transactions",
  "account_credits",
  // Hire
  "job_applications",
  "job_postings",
  "onboarding_tasks",
  // Integrations / misc
  "accounting_connections",
  "ai_usage_log",
  "audit_log",
  "incidents",
  "feature_request_upvotes",
  "feature_requests",
  "bug_reports",
  "user_referrals",
  "referral_rewards",
  // Identity (delete LAST in public schema; auth.users handled separately)
  "businesses",
  "profiles",
];

const FILTER_COLUMN_OVERRIDES = {
  // Tables that may not have an `id` column — fall back to a safe alternative.
  // (Composite-key tables.) None currently known, kept for future use.
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function countTable(name) {
  const { count, error } = await supabase
    .from(name)
    .select("*", { count: "exact", head: true });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache") || error.code === "PGRST205") {
      return { count: 0, missing: true };
    }
    return { count: 0, error: error.message };
  }
  return { count: count ?? 0 };
}

async function deleteAll(name) {
  const col = FILTER_COLUMN_OVERRIDES[name] || "id";
  // Use a tautology that matches every row: column is not null.
  const { error } = await supabase.from(name).delete().not(col, "is", null);
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache") || error.code === "PGRST205") {
      return { skipped: true };
    }
    return { error: error.message };
  }
  return {};
}

async function listAuthUsers() {
  const all = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
    if (page > 100) break; // hard safety stop
  }
  return all;
}

async function listAllStripe(resource, params = {}) {
  const all = [];
  for await (const item of stripe[resource].list({ limit: 100, ...params })) {
    all.push(item);
  }
  return all;
}

function fmt(rows) {
  return rows.length === 0 ? "(all empty)" : "";
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("=================================================================");
  console.log("  SERVLO  ::  test-data reset");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (read-only, no writes)" : "LIVE (destructive)"}`);
  console.log(`  Stripe: ${stripeKey.slice(0, 8)}*** (test mode confirmed)`);
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log("=================================================================");
  console.log("");

  // Phase 1 — Count Supabase rows
  console.log("[1/3] Counting Supabase rows...");
  const tableCounts = {};
  const missingTables = [];
  let totalRows = 0;
  for (const t of WIPE_TABLES) {
    const r = await countTable(t);
    if (r.missing) {
      missingTables.push(t);
      tableCounts[t] = 0;
    } else if (r.error) {
      console.warn(`  ! ${t}: ${r.error}`);
      tableCounts[t] = 0;
    } else {
      tableCounts[t] = r.count;
      totalRows += r.count;
    }
  }

  let users = [];
  try {
    users = await listAuthUsers();
  } catch (e) {
    console.error("  ! Could not list auth users:", e.message);
  }

  // Phase 2 — Count Stripe
  console.log("[2/3] Counting Stripe entities...");
  let customers = [], subscriptions = [];
  try {
    customers = await listAllStripe("customers");
    subscriptions = await listAllStripe("subscriptions", { status: "all" });
  } catch (e) {
    console.error("  ! Stripe list failed:", e.message);
  }

  // Print summary
  console.log("");
  console.log("┌─── COUNTS BEFORE ─────────────────────────────────────────────");
  console.log("│ Supabase tables with rows:");
  const nonEmpty = Object.entries(tableCounts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  if (nonEmpty.length === 0) console.log("│   (all wipe-targets are empty)");
  for (const [t, c] of nonEmpty) console.log(`│   ${t.padEnd(38)} ${String(c).padStart(6)}`);
  console.log(`│ Total wipe-target rows:    ${totalRows}`);
  console.log(`│ auth.users:                ${users.length}`);
  console.log(`│ Stripe customers:          ${customers.length}`);
  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  console.log(`│ Stripe subscriptions:      ${subscriptions.length} (${activeSubs.length} active/trialing)`);
  console.log("│");
  console.log(`│ Tables PRESERVED (will NOT be touched):`);
  for (const t of PRESERVE_TABLES) {
    const r = await countTable(t);
    console.log(`│   ${t.padEnd(38)} ${String(r.count ?? 0).padStart(6)} rows (kept)`);
  }
  if (missingTables.length) {
    console.log("│");
    console.log(`│ Tables not present in DB (skipped): ${missingTables.length}`);
    // Show first 5
    for (const t of missingTables.slice(0, 8)) console.log(`│   ${t}`);
    if (missingTables.length > 8) console.log(`│   ...and ${missingTables.length - 8} more`);
  }
  console.log("└───────────────────────────────────────────────────────────────");
  console.log("");

  if (DRY_RUN) {
    console.log("DRY RUN complete. No changes made.");
    console.log("Re-run without --dry-run to perform the wipe.");
    return;
  }

  // Phase 3 — Execute wipe
  console.log("[3/3] Executing destructive wipe...");
  console.log("");

  // 3a. Cancel Stripe subscriptions
  let subsCancelled = 0;
  for (const sub of subscriptions) {
    if (sub.status === "canceled") continue;
    try {
      await stripe.subscriptions.cancel(sub.id);
      subsCancelled++;
    } catch (e) {
      console.warn(`  ! could not cancel ${sub.id}: ${e.message}`);
    }
  }
  console.log(`  Cancelled ${subsCancelled} Stripe subscription(s).`);

  // 3b. Delete Stripe customers (cascades to payment methods, invoices)
  let customersDeleted = 0;
  for (const c of customers) {
    try {
      await stripe.customers.del(c.id);
      customersDeleted++;
    } catch (e) {
      console.warn(`  ! could not delete customer ${c.id} (${c.email ?? "no email"}): ${e.message}`);
    }
  }
  console.log(`  Deleted ${customersDeleted} Stripe customer(s).`);

  // 3c. Wipe Supabase public tables (in defined order)
  let tablesCleared = 0;
  for (const t of WIPE_TABLES) {
    if ((tableCounts[t] || 0) === 0) continue;
    const r = await deleteAll(t);
    if (r.skipped) continue;
    if (r.error) {
      console.warn(`  ! ${t}: ${r.error}`);
    } else {
      tablesCleared++;
    }
  }
  console.log(`  Cleared ${tablesCleared} Supabase public table(s).`);

  // 3d. Delete auth users
  let usersDeleted = 0;
  for (const u of users) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (error) throw error;
      usersDeleted++;
    } catch (e) {
      console.warn(`  ! could not delete user ${u.email ?? u.id}: ${e.message}`);
    }
  }
  console.log(`  Deleted ${usersDeleted} auth user(s).`);

  // Phase 4 — Verify
  console.log("");
  console.log("Verifying...");
  let remainingRows = 0;
  const stillHasData = [];
  for (const t of WIPE_TABLES) {
    const r = await countTable(t);
    if (r.count > 0) {
      stillHasData.push([t, r.count]);
      remainingRows += r.count;
    }
  }
  const usersAfter = await listAuthUsers().catch(() => []);
  const customersAfter = await listAllStripe("customers").catch(() => []);
  const subsAfter = await listAllStripe("subscriptions", { status: "all" }).catch(() => []);
  const activeSubsAfter = subsAfter.filter((s) => s.status === "active" || s.status === "trialing");

  console.log("");
  console.log("┌─── COUNTS AFTER ──────────────────────────────────────────────");
  console.log(`│ Supabase wipe-target rows: ${remainingRows}`);
  if (stillHasData.length) {
    for (const [t, c] of stillHasData) console.log(`│   (!) ${t}: ${c}`);
  }
  console.log(`│ auth.users:                ${usersAfter.length}`);
  console.log(`│ Stripe customers:          ${customersAfter.length}`);
  console.log(`│ Stripe subscriptions:      ${subsAfter.length} (${activeSubsAfter.length} active/trialing)`);
  console.log("└───────────────────────────────────────────────────────────────");
  console.log("");

  const allClean =
    remainingRows === 0 &&
    usersAfter.length === 0 &&
    customersAfter.length === 0 &&
    activeSubsAfter.length === 0;

  if (allClean) {
    console.log("All test data wiped. Database and Stripe test mode are clean.");
  } else {
    console.log("Some data remains. Review the warnings above.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("");
  console.error("Fatal error:", e.message);
  console.error(e.stack);
  process.exit(1);
});
