/**
 * Apply pending migrations to Supabase.
 *
 * Requires SUPABASE_ACCESS_TOKEN env var (Supabase personal access token).
 * Get one at: https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migrations.mjs
 *
 * Alternatively, apply migrations manually via:
 *   https://supabase.com/dashboard/project/isqnfuvgovzhyhkuynma/editor
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const PROJECT_REF = "isqnfuvgovzhyhkuynma";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://isqnfuvgovzhyhkuynma.supabase.co";

if (!ACCESS_TOKEN && !SERVICE_ROLE_KEY) {
  console.error("⚠️  No SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY found.");
  console.error("   Set SUPABASE_ACCESS_TOKEN to your personal access token to apply migrations.");
  console.error("   Or apply migrations manually at:");
  console.error(`   https://supabase.com/dashboard/project/${PROJECT_REF}/editor`);
  process.exit(1);
}

async function runQuery(sql) {
  if (ACCESS_TOKEN) {
    // Use Management API with PAT
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Management API error ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  }
  throw new Error("No valid auth method available");
}

// Check table existence via REST API (no auth issues for service role)
async function tableExists(tableName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
    headers: {
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "apikey": SERVICE_ROLE_KEY,
    }
  });
  return res.status === 200;
}

const MIGRATIONS_DIR = "supabase/migrations";
const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith(".sql"))
  .sort();

console.log(`Found ${files.length} migration files.\n`);

// Check which new tables exist
const newTables = [
  "job_events", "job_templates", "owner_notifications", "sms_messages", "job_surveys",
  "pricebook_items", "client_notes", "client_properties", "compliance_documents",
  "grow_campaigns", "grow_social_posts", "grow_review_responses", "grow_referrals",
  "grow_ad_campaigns", "marketplace_leads", "leads_accepted", "lead_pipeline",
  "vehicles", "vehicle_service_records", "vehicle_trips",
  "bank_transactions", "expense_claims", "bas_lodgements",
  "job_postings", "job_applications", "onboarding_tasks",
  "call_logs", "payment_transactions",
];

console.log("Checking table existence...");
const tableStatus = {};
for (const t of newTables) {
  tableStatus[t] = await tableExists(t);
  process.stdout.write(`  ${t}: ${tableStatus[t] ? "✅ exists" : "❌ missing"}\n`);
}

const missing = Object.entries(tableStatus).filter(([, exists]) => !exists).map(([name]) => name);
if (missing.length === 0) {
  console.log("\n✅ All tables exist. No migration needed.");
  process.exit(0);
}

console.log(`\n${missing.length} tables missing. Need to apply migrations.\n`);

if (!ACCESS_TOKEN) {
  console.log("❌ Cannot apply migrations without SUPABASE_ACCESS_TOKEN.");
  console.log("\n📋 MANUAL MIGRATION INSTRUCTIONS:");
  console.log(`   1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/editor`);
  console.log(`   2. Copy and paste the SQL from:`);
  for (const f of files) {
    console.log(`      - ${MIGRATIONS_DIR}/${f}`);
  }
  console.log(`   3. Run each SQL file in order.`);
  console.log(`   4. Then re-run this script to verify.`);
  process.exit(1);
}

// Apply migrations using Management API
for (const file of files) {
  console.log(`Applying: ${file}...`);
  try {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    await runQuery(sql);
    console.log(`  ✅ Applied successfully`);
  } catch (err) {
    console.log(`  ⚠️  ${err.message}`);
  }
}

console.log("\nVerifying tables after migration...");
let allOk = true;
for (const t of newTables) {
  const exists = await tableExists(t);
  if (!exists) {
    console.log(`  ❌ ${t} still missing`);
    allOk = false;
  }
}
if (allOk) {
  console.log("✅ All tables confirmed present.");
}
process.exit(allOk ? 0 : 1);
