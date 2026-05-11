import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://isqnfuvgovzhyhkuynma.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const migrationFile = process.argv[2] || path.join(__dirname, '../supabase/migrations/20260511200000_complete_platform_overhaul.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

// Split into statements and run via Supabase REST API
// We'll use the pg endpoint via direct HTTP
const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({ sql_text: sql })
});

if (!response.ok) {
  const text = await response.text();
  console.log('rpc/exec_sql failed:', response.status, text);
  console.log('Trying alternative approach via individual statements...');

  // Try running individual statements via supabase client
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  // Split statements by semicolon (rough split, handles most cases)
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    const { error } = await supabase.rpc('exec_sql', { sql_text: stmt + ';' }).catch(() => ({error: {message: 'rpc not available'}}));
    if (error) {
      console.warn('Statement error (may be OK):', stmt.substring(0, 60), '->', error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Done: ${successCount} succeeded, ${errorCount} skipped/errored`);
} else {
  const result = await response.json();
  console.log('Migration applied successfully:', result);
}
