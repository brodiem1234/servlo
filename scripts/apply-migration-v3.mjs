/**
 * Apply migration by splitting into individual DDL statements
 * and using the Supabase REST API with service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = 'https://isqnfuvgovzhyhkuynma.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const migrationFile = process.argv[2] || path.join(__dirname, '../supabase/migrations/20260511200000_complete_platform_overhaul.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('Applying migration:', path.basename(migrationFile));

// Use the admin REST query endpoint
// Supabase exposes a raw query endpoint via the admin API at /rest/v1/
// We can use the from() approach with rpc

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Test the connection first
const { data: testData, error: testError } = await supabase
  .from('businesses')
  .select('id')
  .limit(1);

if (testError) {
  console.error('Connection test failed:', testError.message);
} else {
  console.log('Connection OK. Businesses table accessible.');
}

// Check if specific columns already exist or need to be added
// by testing a query that would fail if columns don't exist
const checks = [
  { table: 'jobs', column: 'job_number' },
  { table: 'businesses', column: 'is_founding_member' },
  { table: 'clients', column: 'company_name' },
];

for (const check of checks) {
  const { error } = await supabase.from(check.table).select(check.column).limit(1);
  if (error && error.message.includes('does not exist')) {
    console.log(`Column ${check.table}.${check.column}: MISSING (migration needed)`);
  } else if (error) {
    console.log(`Column ${check.table}.${check.column}: error - ${error.message}`);
  } else {
    console.log(`Column ${check.table}.${check.column}: EXISTS`);
  }
}

// Check if plan_limits table exists
const { error: planLimitsError } = await supabase.from('plan_limits').select('plan').limit(1);
if (planLimitsError) {
  console.log('plan_limits table: MISSING');
} else {
  console.log('plan_limits table: EXISTS');
}

const { error: bugReportsError } = await supabase.from('bug_reports').select('id').limit(1);
if (bugReportsError) {
  console.log('bug_reports table: MISSING');
} else {
  console.log('bug_reports table: EXISTS');
}

console.log('\nMigration file is ready at:', migrationFile);
console.log('Since direct SQL execution is not available via the service role key REST API,');
console.log('the migration needs to be applied via Supabase Dashboard SQL editor.');
