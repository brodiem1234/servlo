import type { SupabaseClient } from "@supabase/supabase-js";

function moneyGstInclusive(totalIncl: number) {
  const subtotal = Math.round((totalIncl / 1.1) * 100) / 100;
  const gst = Math.round((totalIncl - subtotal) * 100) / 100;
  return { subtotal, gst, total: totalIncl };
}

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function removeAllDemoForOwner(sb: SupabaseClient, ownerId: string): Promise<void> {
  const { data: demoJobs } = await sb.from("jobs").select("id").eq("owner_id", ownerId).eq("is_demo", true);
  const jobIds = (demoJobs ?? []).map((j) => j.id);
  if (jobIds.length > 0) {
    await sb.from("job_photos").delete().in("job_id", jobIds);
  }

  const { data: demoInvoices } = await sb.from("invoices").select("id").eq("owner_id", ownerId).eq("is_demo", true);
  const invoiceIds = (demoInvoices ?? []).map((i) => i.id);
  if (invoiceIds.length > 0) {
    await sb.from("invoice_items").delete().in("invoice_id", invoiceIds);
    await sb.from("invoices").delete().in("id", invoiceIds);
  }

  const { data: demoQuotes } = await sb.from("quotes").select("id").eq("owner_id", ownerId).eq("is_demo", true);
  const quoteIds = (demoQuotes ?? []).map((q) => q.id);
  if (quoteIds.length > 0) {
    await sb.from("quote_items").delete().in("quote_id", quoteIds);
    await sb.from("quotes").delete().in("id", quoteIds);
  }

  await sb.from("jobs").delete().eq("owner_id", ownerId).eq("is_demo", true);
  await sb.from("clients").delete().eq("owner_id", ownerId).eq("is_demo", true);
  await sb.from("employees").delete().eq("owner_id", ownerId).eq("is_demo", true);
}

/**
 * Seeds template records for a brand-new owner account (service role client).
 */
export async function seedOwnerDemoData(
  sb: SupabaseClient,
  ownerId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await removeAllDemoForOwner(sb, ownerId);

    const today = localDateKey();
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueKey = localDateKey(due);

    const { data: clientRow, error: clientErr } = await sb
      .from("clients")
      .insert({
        owner_id: ownerId,
        full_name: "Alex Johnson",
        company_name: "Johnson Properties",
        email: "demo-client@servlo.com.au",
        phone: "0412 345 678",
        address: "12 Example Street",
        suburb: "Adelaide",
        state: "SA",
        postcode: "5000",
        status: "active",
        notes: "This is a demo client. Replace with your real clients.",
        source: "demo",
        portal_token: crypto.randomUUID(),
        abn: "",
        is_demo: true
      })
      .select("id")
      .single();

    if (clientErr || !clientRow?.id) {
      return { ok: false, message: clientErr?.message ?? "Failed to insert demo client" };
    }

    const clientId = clientRow.id as string;

    const { data: employeeRow, error: empErr } = await sb
      .from("employees")
      .insert({
        owner_id: ownerId,
        full_name: "Sam Taylor",
        email: "demo-employee@servlo.com.au",
        phone: "0423 456 789",
        trade_type: "Field Technician",
        licences: [],
        hourly_rate: 0,
        role: "employee",
        is_demo: true
      })
      .select("id")
      .single();

    if (empErr || !employeeRow?.id) {
      await sb.from("clients").delete().eq("id", clientId);
      return { ok: false, message: empErr?.message ?? "Failed to insert demo employee" };
    }

    const employeeId = employeeRow.id as string;

    const { error: jobErr } = await sb.from("jobs").insert({
      owner_id: ownerId,
      client_id: clientId,
      employee_id: employeeId,
      title: "Residential Service Call",
      description: "This is a demo job. Create your first real job to get started.",
      status: "in_progress",
      priority: "normal",
      scheduled_date: today,
      scheduled_start: "09:00",
      scheduled_end: "12:00",
      address: "12 Example Street",
      suburb: "Adelaide",
      state: "SA",
      job_type: "Service",
      notes: "",
      materials_cost: 0,
      labour_hours: 0,
      hourly_rate: 0,
      is_demo: true
    });

    if (jobErr) {
      await sb.from("employees").delete().eq("id", employeeId);
      await sb.from("clients").delete().eq("id", clientId);
      return { ok: false, message: jobErr.message ?? "Failed to insert demo job" };
    }

    const quoteTotals = moneyGstInclusive(1250);
    const quoteNumber = "Example Quote — Residential Work";

    const { data: quoteRow, error: quoteErr } = await sb
      .from("quotes")
      .insert({
        owner_id: ownerId,
        client_id: clientId,
        quote_number: quoteNumber,
        client_name: "Alex Johnson",
        subtotal: quoteTotals.subtotal,
        gst_amount: quoteTotals.gst,
        total: quoteTotals.total,
        status: "draft",
        is_demo: true
      })
      .select("id")
      .single();

    if (quoteErr || !quoteRow?.id) {
      return { ok: false, message: quoteErr?.message ?? "Failed to insert demo quote" };
    }

    const quoteId = quoteRow.id as string;

    await sb.from("quote_items").insert({
      quote_id: quoteId,
      description: "Residential scope — labour & materials",
      quantity: 1,
      unit_price: quoteTotals.subtotal,
      gst_applicable: true,
      line_total: quoteTotals.subtotal
    });

    const invTotals = moneyGstInclusive(850);

    const { data: invRow, error: invErr } = await sb
      .from("invoices")
      .insert({
        owner_id: ownerId,
        client_id: clientId,
        invoice_number: "INV-00001",
        issue_date: today,
        due_date: dueKey,
        subtotal: invTotals.subtotal,
        gst_amount: invTotals.gst,
        amount: invTotals.total,
        status: "unpaid",
        is_demo: true
      })
      .select("id")
      .single();

    if (invErr || !invRow?.id) {
      return { ok: false, message: invErr?.message ?? "Failed to insert demo invoice" };
    }

    const invoiceId = invRow.id as string;
    const invLineNet = invTotals.subtotal;
    await sb.from("invoice_items").insert({
      invoice_id: invoiceId,
      description: "Professional services (demo)",
      quantity: 1,
      unit_price: invLineNet,
      gst_applicable: true,
      line_total: invLineNet
    });

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
