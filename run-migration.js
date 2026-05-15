// Temporary migration runner — delete after use.
// Requires: SUPABASE_DB_PASSWORD env var set to your Supabase project DB password.
// Run: SUPABASE_DB_PASSWORD=yourpassword node run-migration.js
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const sql = fs.readFileSync(
  path.join(__dirname, "supabase/migrations/20260514110000_grow_v2_rls_fix.sql"),
  "utf8"
);

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.error("Set SUPABASE_DB_PASSWORD to your Supabase project database password.");
  process.exit(1);
}

const connectionString = `postgresql://postgres.isqnfuvgovzhyhkuynma:${dbPassword}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`;

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected to Supabase DB");
    await client.query(sql);
    console.log("Migration applied successfully");

    const verify = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'grow_campaigns','grow_social_posts',
          'grow_review_responses','grow_referrals','grow_ad_campaigns'
        )
      ORDER BY tablename;
    `);
    console.log("\nTable RLS status:");
    verify.rows.forEach((r) => console.log(`  ${r.tablename}: RLS=${r.rowsecurity}`));

    const policies = await client.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'grow_campaigns','grow_social_posts',
          'grow_review_responses','grow_referrals','grow_ad_campaigns'
        )
      ORDER BY tablename, policyname;
    `);
    console.log("\nPolicies:");
    policies.rows.forEach((r) => console.log(`  ${r.tablename}: ${r.policyname}`));
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
