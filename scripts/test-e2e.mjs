/**
 * SERVLO E2E Test Script
 * Tests key API endpoints and database state.
 *
 * Usage:
 *   node --env-file=.env.local scripts/test-e2e.mjs [--base-url=https://servlo.com.au]
 *
 * Or against local dev server:
 *   npm run dev &
 *   node --env-file=.env.local scripts/test-e2e.mjs --base-url=http://localhost:3000
 */

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const baseUrlArg = args.find(a => a.startsWith('--base-url='));
const BASE_URL = baseUrlArg
  ? baseUrlArg.replace('--base-url=', '')
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://servlo.com.au');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://isqnfuvgovzhyhkuynma.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`\n==== SERVLO E2E Tests ====`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Supabase: ${SUPABASE_URL}\n`);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

// ── HTTP Tests ────────────────────────────────────────────────────────────────

console.log('HTTP Endpoint Tests:');

await test('GET / — landing page loads', async () => {
  const res = await fetch(`${BASE_URL}/`);
  assert(res.ok, `Got ${res.status}`);
  const text = await res.text();
  assert(text.includes('SERVLO'), 'Missing SERVLO brand');
});

await test('GET /guarantee — guarantee page loads', async () => {
  const res = await fetch(`${BASE_URL}/guarantee`);
  assert(res.ok, `Got ${res.status}`);
  const text = await res.text();
  assert(text.includes('money-back') || text.includes('guarantee'), 'Missing guarantee content');
});

await test('GET /api/founders/count — founders count endpoint', async () => {
  const res = await fetch(`${BASE_URL}/api/founders/count`);
  assert(res.ok, `Got ${res.status}`);
  const data = await res.json();
  assert(typeof data.count === 'number', 'count should be a number');
  assert(typeof data.remaining === 'number', 'remaining should be a number');
  console.log(`     Founder count: ${data.count}/100 (${data.remaining} remaining)`);
});

await test('GET /api/founding-100/count — founding-100 count endpoint', async () => {
  const res = await fetch(`${BASE_URL}/api/founding-100/count`);
  assert(res.ok, `Got ${res.status}`);
  const data = await res.json();
  assert(typeof data.count === 'number', 'count should be a number');
});

await test('GET /pricing — pricing page (via landing with pricing section)', async () => {
  const res = await fetch(`${BASE_URL}/`);
  const text = await res.text();
  assert(text.includes('$29') || text.includes('Solo'), 'Missing Solo pricing');
  assert(text.includes('$79') || text.includes('Team'), 'Missing Team pricing');
  assert(text.includes('$149') || text.includes('Business'), 'Missing Business pricing');
});

// ── Database Tests ────────────────────────────────────────────────────────────

if (SERVICE_ROLE_KEY) {
  console.log('\nDatabase Tests:');
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  await test('businesses table accessible', async () => {
    const { error } = await admin.from('businesses').select('id').limit(1);
    assert(!error, error?.message);
  });

  await test('jobs table accessible', async () => {
    const { error } = await admin.from('jobs').select('id').limit(1);
    assert(!error, error?.message);
  });

  await test('clients table accessible', async () => {
    const { error } = await admin.from('clients').select('id').limit(1);
    assert(!error, error?.message);
  });

  await test('invoices table accessible', async () => {
    const { error } = await admin.from('invoices').select('id').limit(1);
    assert(!error, error?.message);
  });

  await test('quotes table accessible', async () => {
    const { error } = await admin.from('quotes').select('id').limit(1);
    assert(!error, error?.message);
  });

  await test('profiles table accessible', async () => {
    const { error } = await admin.from('profiles').select('id').limit(1);
    assert(!error, error?.message);
  });

  // Check new columns
  await test('businesses.is_founding_member column exists', async () => {
    const { error } = await admin.from('businesses').select('is_founding_member').limit(1);
    if (error && error.message.includes('does not exist')) {
      throw new Error('Column missing — run migration 20260511200000');
    }
    // error might be "no rows" which is fine
  });

  await test('plan_limits table exists', async () => {
    const { data, error } = await admin.from('plan_limits').select('plan').limit(5);
    if (error) {
      throw new Error(`plan_limits missing — run migration 20260511200000: ${error.message}`);
    }
    const plans = data?.map(r => r.plan) ?? [];
    assert(plans.includes('solo'), 'Missing solo plan');
    assert(plans.includes('team'), 'Missing team plan');
    assert(plans.includes('business'), 'Missing business plan');
    console.log(`     Plans: ${plans.join(', ')}`);
  });

  await test('bug_reports table exists', async () => {
    const { error } = await admin.from('bug_reports').select('id').limit(1);
    if (error) throw new Error(`bug_reports missing: ${error.message}`);
  });

  await test('ai_usage_log table exists', async () => {
    const { error } = await admin.from('ai_usage_log').select('id').limit(1);
    if (error) throw new Error(`ai_usage_log missing: ${error.message}`);
  });

  await test('referral_rewards table exists', async () => {
    const { error } = await admin.from('referral_rewards').select('id').limit(1);
    if (error) throw new Error(`referral_rewards missing: ${error.message}`);
  });

  await test('jobs.job_number column exists', async () => {
    const { error } = await admin.from('jobs').select('job_number').limit(1);
    assert(!error || !error.message.includes('does not exist'), error?.message ?? 'column missing');
  });

  await test('invoices.invoice_number column exists', async () => {
    const { error } = await admin.from('invoices').select('invoice_number').limit(1);
    assert(!error || !error.message.includes('does not exist'), error?.message ?? 'column missing');
  });
} else {
  console.log('\nSkipping database tests (SUPABASE_SERVICE_ROLE_KEY not set)');
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n==== Results: ${passed} passed, ${failed} failed ====\n`);
process.exit(failed > 0 ? 1 : 0);
