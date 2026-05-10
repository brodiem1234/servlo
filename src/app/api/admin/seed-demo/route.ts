import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/seed-demo
 * Seeds realistic Australian tradie demo data for the current owner.
 * Idempotent — checks for existing demo data before inserting.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const ownerId = user.id;
  const now = new Date();

  function daysAgo(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function daysFromNow(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // ── Check if already seeded ────────────────────────────────────────────────
  const { count: existingClients } = await admin
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("is_demo", true);

  if ((existingClients ?? 0) >= 5) {
    return NextResponse.json({ ok: true, message: "Demo data already exists", skipped: true });
  }

  const errors: string[] = [];

  // ── 1. Clients ─────────────────────────────────────────────────────────────
  const { data: clients, error: clientErr } = await admin
    .from("clients")
    .insert([
      { owner_id: ownerId, full_name: "Sandra Mitchell", email: "sandra.mitchell@gmail.com", phone: "0412 345 678", address: "14 Acacia Avenue", suburb: "Norwood", state: "SA", postcode: "5067", is_demo: true, status: "active" },
      { owner_id: ownerId, full_name: "James Kowalski", email: "jkowalski@bigpond.com", phone: "0423 456 789", address: "28 Banksia Drive", suburb: "Prospect", state: "SA", postcode: "5082", is_demo: true, status: "active" },
      { owner_id: ownerId, full_name: "Priya Sharma", email: "priya.sharma@hotmail.com", phone: "0434 567 890", address: "7 Eucalyptus Court", suburb: "Glenelg", state: "SA", postcode: "5045", is_demo: true, status: "active" },
      { owner_id: ownerId, full_name: "Tom & Lisa Nguyen", email: "nguyen.family@gmail.com", phone: "0445 678 901", address: "52 Jacaranda Street", suburb: "Unley", state: "SA", postcode: "5061", is_demo: true, status: "active" },
      { owner_id: ownerId, full_name: "Robert Bauer", email: "rob.bauer@outlook.com", phone: "0456 789 012", address: "3/19 Maple Road", suburb: "Edwardstown", state: "SA", postcode: "5039", is_demo: true, status: "active" },
    ])
    .select("id, full_name");

  if (clientErr && clientErr.code !== "42P01") errors.push(`clients: ${clientErr.message}`);
  const clientRows = clients ?? [];
  const [c1, c2, c3, c4, c5] = clientRows.map(c => c.id);

  // ── 2. Jobs ────────────────────────────────────────────────────────────────
  const { data: jobs, error: jobErr } = await admin
    .from("jobs")
    .insert([
      { owner_id: ownerId, client_id: c1 ?? null, title: "Hot water system replacement", status: "completed", scheduled_date: daysAgo(5), address: "14 Acacia Avenue, Norwood SA 5067", notes: "Rheem 250L. Old unit removed and disposed.", is_demo: true },
      { owner_id: ownerId, client_id: c2 ?? null, title: "Split system installation — lounge room", status: "completed", scheduled_date: daysAgo(3), address: "28 Banksia Drive, Prospect SA 5082", notes: "Daikin 7.1kW. Wall bracket and condenser outside.", is_demo: true },
      { owner_id: ownerId, client_id: c3 ?? null, title: "Blocked drain — kitchen & laundry", status: "in_progress", scheduled_date: daysAgo(1), address: "7 Eucalyptus Court, Glenelg SA 5045", notes: "CCTV inspection required.", is_demo: true },
      { owner_id: ownerId, client_id: c4 ?? null, title: "Switchboard upgrade — 3-phase", status: "in_progress", scheduled_date: now.toISOString().slice(0, 10), address: "52 Jacaranda Street, Unley SA 5061", notes: "Replace fuse box with safety switches.", is_demo: true },
      { owner_id: ownerId, client_id: c5 ?? null, title: "Oven not heating — Westinghouse", status: "scheduled", scheduled_date: daysFromNow(2), address: "3/19 Maple Road, Edwardstown SA 5039", notes: "Bake element suspected. Quote first.", is_demo: true },
      { owner_id: ownerId, client_id: c1 ?? null, title: "Tap washer replacement — bathroom", status: "completed", scheduled_date: daysAgo(10), address: "14 Acacia Avenue, Norwood SA 5067", notes: "3 x tap washers, 1 x cistern valve.", is_demo: true },
      { owner_id: ownerId, client_id: c2 ?? null, title: "Ceiling fan installation x2", status: "completed", scheduled_date: daysAgo(8), address: "28 Banksia Drive, Prospect SA 5082", notes: "Master bedroom + guest room.", is_demo: true },
      { owner_id: ownerId, client_id: c3 ?? null, title: "Gas heater service", status: "scheduled", scheduled_date: daysFromNow(5), address: "7 Eucalyptus Court, Glenelg SA 5045", notes: "Annual service + carbon monoxide test.", is_demo: true },
      { owner_id: ownerId, client_id: c4 ?? null, title: "Downlight installation — kitchen 10x", status: "completed", scheduled_date: daysAgo(14), address: "52 Jacaranda Street, Unley SA 5061", notes: "LED retrofit, dimmer switch included.", is_demo: true },
      { owner_id: ownerId, client_id: c5 ?? null, title: "Emergency call-out — water leak", status: "completed", scheduled_date: daysAgo(7), address: "3/19 Maple Road, Edwardstown SA 5039", notes: "Burst flexi hose under kitchen sink. Fixed same day.", is_demo: true },
    ])
    .select("id");

  if (jobErr && jobErr.code !== "42P01") errors.push(`jobs: ${jobErr.message}`);
  const jobRows = jobs ?? [];
  const [j1, j2, j6, j7, j9, j10] = [jobRows[0]?.id, jobRows[1]?.id, jobRows[5]?.id, jobRows[6]?.id, jobRows[8]?.id, jobRows[9]?.id];

  // ── 3. Invoices ────────────────────────────────────────────────────────────
  const { error: invErr } = await admin
    .from("invoices")
    .insert([
      { owner_id: ownerId, client_id: c1 ?? null, job_id: j1 ?? null, invoice_number: "INV-1001", status: "paid", subtotal: 1250, gst: 125, total: 1375, issue_date: daysAgo(5), due_date: daysAgo(5), paid_at: daysAgo(4), is_demo: true, notes: "Hot water system — parts & labour" },
      { owner_id: ownerId, client_id: c2 ?? null, job_id: j2 ?? null, invoice_number: "INV-1002", status: "paid", subtotal: 1800, gst: 180, total: 1980, issue_date: daysAgo(3), due_date: daysAgo(3), paid_at: daysAgo(2), is_demo: true, notes: "Split system supply & install" },
      { owner_id: ownerId, client_id: c4 ?? null, job_id: j9 ?? null, invoice_number: "INV-1003", status: "paid", subtotal: 750, gst: 75, total: 825, issue_date: daysAgo(14), due_date: daysAgo(7), paid_at: daysAgo(6), is_demo: true, notes: "LED downlights x10 + dimmer" },
      { owner_id: ownerId, client_id: c3 ?? null, invoice_number: "INV-1004", status: "unpaid", subtotal: 420, gst: 42, total: 462, issue_date: daysAgo(1), due_date: daysFromNow(13), is_demo: true, notes: "Drain inspection and clearing — invoice pending job completion" },
      { owner_id: ownerId, client_id: c5 ?? null, job_id: j10 ?? null, invoice_number: "INV-1005", status: "overdue", subtotal: 280, gst: 28, total: 308, issue_date: daysAgo(21), due_date: daysAgo(7), is_demo: true, notes: "Emergency call-out — burst flexi hose" },
    ]);

  if (invErr && invErr.code !== "42P01") errors.push(`invoices: ${invErr.message}`);

  // ── 4. Quotes ──────────────────────────────────────────────────────────────
  const { error: quoteErr } = await admin
    .from("quotes")
    .insert([
      { owner_id: ownerId, client_id: c3 ?? null, quote_number: "QT-501", status: "sent", subtotal: 890, gst: 89, total: 979, issue_date: daysAgo(2), expiry_date: daysFromNow(12), is_demo: true, notes: "Full drain inspection + CCTV + hydro-jetting" },
      { owner_id: ownerId, client_id: c4 ?? null, quote_number: "QT-502", status: "accepted", subtotal: 2200, gst: 220, total: 2420, issue_date: daysAgo(6), expiry_date: daysFromNow(8), is_demo: true, notes: "3-phase switchboard upgrade, consumer mains replacement" },
      { owner_id: ownerId, client_id: c5 ?? null, quote_number: "QT-503", status: "draft", subtotal: 180, gst: 18, total: 198, issue_date: daysAgo(1), expiry_date: daysFromNow(13), is_demo: true, notes: "Oven element replacement — pending site inspection" },
    ]);

  if (quoteErr && quoteErr.code !== "42P01") errors.push(`quotes: ${quoteErr.message}`);

  // ── 5. Pricebook items ─────────────────────────────────────────────────────
  const { error: pbErr } = await admin
    .from("pricebook_items")
    .insert([
      { owner_id: ownerId, name: "Labour — Standard rate", description: "Per hour, Mon–Fri 7am–5pm", unit_price: 95, unit: "hour", category: "Labour", is_demo: true },
      { owner_id: ownerId, name: "Service call fee", description: "Travel and diagnostic charge", unit_price: 120, unit: "call", category: "Labour", is_demo: true },
      { owner_id: ownerId, name: "Materials markup", description: "Cost + 30% on all materials supplied", unit_price: 0, unit: "item", category: "Materials", is_demo: true },
    ]);

  if (pbErr && pbErr.code !== "42P01") errors.push(`pricebook: ${pbErr.message}`);

  // ── 6. Bank transactions ───────────────────────────────────────────────────
  const { error: txErr } = await admin
    .from("bank_transactions")
    .insert([
      { owner_id: ownerId, date: daysAgo(4), description: "PAYMENT RECEIVED - Sandra Mitchell", amount: 1375, category: "Income", reconciled: true, source: "bank", is_demo: true },
      { owner_id: ownerId, date: daysAgo(2), description: "PAYMENT RECEIVED - James Kowalski", amount: 1980, category: "Income", reconciled: true, source: "bank", is_demo: true },
      { owner_id: ownerId, date: daysAgo(9), description: "FUEL - BP KESWICK", amount: -89.40, category: "Vehicle", reconciled: true, source: "bank", is_demo: true },
      { owner_id: ownerId, date: daysAgo(6), description: "TRADELINK PLUMBING SUPPLIES", amount: -342.80, category: "Materials", reconciled: true, source: "bank", is_demo: true },
      { owner_id: ownerId, date: daysAgo(11), description: "PAYMENT RECEIVED - Tom & Lisa Nguyen", amount: 825, category: "Income", reconciled: false, source: "bank", is_demo: true },
    ]);

  if (txErr && txErr.code !== "42P01") errors.push(`bank_transactions: ${txErr.message}`);

  // ── 7. Expense claims ──────────────────────────────────────────────────────
  const { error: expErr } = await admin
    .from("expense_claims")
    .insert([
      { owner_id: ownerId, description: "Fuel — weekly fill (Ford Transit)", amount: 89.40, category: "Vehicle", status: "approved", expense_date: daysAgo(9), is_demo: true },
      { owner_id: ownerId, description: "Tradelink — copper fittings and flexi hoses", amount: 214.60, category: "Materials", status: "pending", expense_date: daysAgo(6), is_demo: true },
      { owner_id: ownerId, description: "Milwaukee M12 inspection camera", amount: 380, category: "Tools", status: "pending", expense_date: daysAgo(3), is_demo: true },
    ]);

  if (expErr && expErr.code !== "42P01") errors.push(`expense_claims: ${expErr.message}`);

  // ── 8. Vehicles ────────────────────────────────────────────────────────────
  const { error: vehErr } = await admin
    .from("vehicles")
    .insert([
      { owner_id: ownerId, name: "Van 1", make: "Ford", model: "Transit", year: 2021, registration: "S123ABC", colour: "White", fuel_type: "diesel", odometer_km: 48200, is_demo: true },
      { owner_id: ownerId, name: "Ute 1", make: "Toyota", model: "HiLux SR5", year: 2022, registration: "S456DEF", colour: "White", fuel_type: "diesel", odometer_km: 31500, is_demo: true },
    ]);

  if (vehErr && vehErr.code !== "42P01") errors.push(`vehicles: ${vehErr.message}`);

  // ── 9. Job posting ─────────────────────────────────────────────────────────
  const { error: postErr } = await admin
    .from("job_postings")
    .insert([
      { owner_id: ownerId, title: "Qualified Plumber — Full Time", description: "We're a growing plumbing business based in Adelaide SA looking for an experienced plumber to join our team. Must hold a current plumbing licence. Monday–Friday, competitive salary.", employment_type: "full_time", trade: "Plumbing", location: "Adelaide SA", salary_min: 85000, salary_max: 105000, salary_type: "annual", status: "published", is_demo: true },
    ]);

  if (postErr && postErr.code !== "42P01") errors.push(`job_postings: ${postErr.message}`);

  // ── 10. Social posts ───────────────────────────────────────────────────────
  const { error: socialErr } = await admin
    .from("grow_social_posts")
    .insert([
      { owner_id: ownerId, platform: "facebook", caption: "🔧 Another happy customer in Norwood! We replaced a failing hot water system today — same-day service, no mess left behind. If your hot water isn't up to scratch, give us a call for a free quote. #Adelaide #Plumbing #HotWater", hashtags: ["Adelaide", "Plumbing", "HotWater"], status: "draft", suggested_date: daysFromNow(1), is_demo: true },
      { owner_id: ownerId, platform: "instagram", caption: "Before & after: old ducted system out, brand new split system in. Client in Prospect is loving it already. ❄️ We supply and install Daikin, Mitsubishi and Fujitsu. DM for a quote!", hashtags: ["AirCon", "Adelaide", "AirConditioning"], status: "draft", suggested_date: daysFromNow(3), is_demo: true },
      { owner_id: ownerId, platform: "facebook", caption: "Did you know a blocked drain left untreated can cause $10,000+ in damage? We use CCTV to find the problem fast and hydro-jetting to clear it completely. Book your drain inspection today.", hashtags: ["Adelaide", "BlockedDrain", "Plumbing"], status: "draft", suggested_date: daysFromNow(7), is_demo: true },
    ]);

  if (socialErr && socialErr.code !== "42P01") errors.push(`grow_social_posts: ${socialErr.message}`);

  // ── 11. Email campaigns ────────────────────────────────────────────────────
  const { error: campErr } = await admin
    .from("grow_campaigns")
    .insert([
      { owner_id: ownerId, name: "Post-job follow up", campaign_type: "email", status: "draft", subject: "How did we go? — Your recent job with us", body: "Hi {client_name}, thanks for choosing us for your recent job. We'd love to hear how we went — could you leave us a quick Google review? {review_link}", is_demo: true },
      { owner_id: ownerId, name: "Winter promotion", campaign_type: "email", status: "draft", subject: "Winter special: $50 off heating service this month", body: "Hi {client_name}, winter is here! Book a heating service in July and save $50. Use code WINTER50. Limited bookings available.", is_demo: true },
    ]);

  if (campErr && campErr.code !== "42P01") errors.push(`grow_campaigns: ${campErr.message}`);

  return NextResponse.json({
    ok: true,
    seeded: {
      clients: clientRows.length,
      jobs: jobRows.length,
      invoices: 5,
      quotes: 3,
      pricebook: 3,
      bankTransactions: 5,
      expenseClaims: 3,
      vehicles: 2,
      jobPostings: 1,
      socialPosts: 3,
      campaigns: 2,
    },
    errors: errors.length > 0 ? errors : undefined,
  });
}
