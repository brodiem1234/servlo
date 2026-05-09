/**
 * One-time script: apply the soft-delete column migration to the live DB.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Run: node scripts/apply-deleted-at-migration.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// The SQL we want to run — same as our migration file
const SQL = `
ALTER TABLE public.businesses  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.jobs        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.clients     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.invoices    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.quotes      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.employees   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.timesheets  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
`;

// Approach 1: Try the supabase /pg/query endpoint (available on some projects)
async function tryPgQuery() {
  const url = `${SUPABASE_URL}/pg/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) throw new Error(`pg/query HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}

// Approach 2: Try calling an exec_sql RPC if it exists
async function tryExecSqlRpc() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await supabase.rpc("exec_sql", { sql: SQL });
  if (error) throw new Error(`exec_sql RPC error: ${error.message}`);
  return "ok";
}

// Approach 3: Verify columns exist by trying a SELECT
async function verifyColumns() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const tables = ["businesses", "jobs", "clients", "invoices", "quotes", "employees", "timesheets"];
  const results = {};
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select("deleted_at")
      .limit(1);
    results[table] = error ? `MISSING (${error.message})` : "OK";
  }
  return results;
}

console.log("Checking current column state...");
const before = await verifyColumns().catch(() => ({}));
console.log("Before:", before);

const allOk = Object.values(before).every((v) => v === "OK");
if (allOk) {
  console.log("✅  All deleted_at columns already exist — no migration needed.");
  process.exit(0);
}

console.log("\nAttempting to apply migration...\n");

let applied = false;

try {
  console.log("Trying /pg/query endpoint...");
  await tryPgQuery();
  console.log("✅  /pg/query succeeded.");
  applied = true;
} catch (err) {
  console.log(`   /pg/query failed: ${err.message}`);
}

if (!applied) {
  try {
    console.log("Trying exec_sql RPC...");
    await tryExecSqlRpc();
    console.log("✅  exec_sql RPC succeeded.");
    applied = true;
  } catch (err) {
    console.log(`   exec_sql RPC failed: ${err.message}`);
  }
}

if (!applied) {
  console.log("\n❌  Could not apply migration programmatically.");
  console.log("\nManual steps required:");
  console.log("1. Open https://supabase.com/dashboard/project/isqnfuvgovzhyhkuynma/editor");
  console.log("2. Paste and run the following SQL:\n");
  console.log(SQL);
  process.exit(1);
}

console.log("\nVerifying after migration...");
const after = await verifyColumns();
console.log("After:", after);
const success = Object.values(after).every((v) => v === "OK");
console.log(success ? "\n✅  All columns confirmed present." : "\n⚠️  Some columns still missing.");
process.exit(success ? 0 : 1);
