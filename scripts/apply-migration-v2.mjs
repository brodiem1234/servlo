/**
 * Apply migration using Supabase Management API (direct SQL execution)
 * Endpoint: POST https://api.supabase.com/v1/projects/{ref}/database/query
 * Requires: SUPABASE_SERVICE_ROLE_KEY or management API token
 *
 * Alternative: Use the pg driver via the connection pooler URL
 * Supabase provides: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
 * But we don't have the DB password, only the service role JWT.
 *
 * Workaround: Use Supabase's REST API with raw SQL via the postgres schema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'isqnfuvgovzhyhkuynma';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const migrationFile = process.argv[2] || path.join(__dirname, '../supabase/migrations/20260511200000_complete_platform_overhaul.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('Applying migration:', path.basename(migrationFile));
console.log('SQL length:', sql.length, 'chars');

// Try the Supabase Management API
// Note: this requires a personal access token, not service role key
// But let's try with the service role key in case it works
const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql })
});

const mgmtText = await mgmtResponse.text();
console.log('Management API response:', mgmtResponse.status, mgmtText.substring(0, 500));

if (!mgmtResponse.ok) {
  console.log('\nManagement API requires personal access token, not service role key.');
  console.log('Migration file has been written to:');
  console.log(migrationFile);
  console.log('\nTo apply manually:');
  console.log('1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF + '/editor');
  console.log('2. Paste the SQL from the migration file');
  console.log('3. Execute it');
  console.log('\nOR run: supabase db push (if supabase CLI is installed)');
} else {
  console.log('Migration applied successfully!');
}
