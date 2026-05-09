import type { SupabaseClient } from "@supabase/supabase-js";

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysFromNow(n: number) {
  return localDateKey(new Date(Date.now() + n * 864e5));
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

  await sb.from("purchase_orders").delete().eq("owner_id", ownerId).eq("is_demo", true);

  // Remove demo timesheets via the employees that belong to this owner.
  const { data: demoEmps } = await sb.from("employees").select("id").eq("owner_id", ownerId).eq("is_demo", true);
  const demoEmpIds = (demoEmps ?? []).map((e) => e.id);
  if (demoEmpIds.length > 0) {
    await sb.from("timesheets").delete().eq("is_demo", true).in("employee_id", demoEmpIds);
  }

  await sb.from("jobs").delete().eq("owner_id", ownerId).eq("is_demo", true);
  await sb.from("employees").delete().eq("owner_id", ownerId).eq("is_demo", true);
  await sb.from("clients").delete().eq("owner_id", ownerId).eq("is_demo", true);
}

/**
 * Seeds template records for a brand-new owner account (service role client).
 * Provides enough data so every major dashboard page shows non-zero numbers.
 */
export async function seedOwnerDemoData(
  sb: SupabaseClient,
  ownerId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    if (!ownerId?.trim()) {
      return { ok: false, message: "Missing owner id for demo seed." };
    }
    console.log("[seed-owner-demo] seeding demo rows for auth user id:", ownerId);
    await removeAllDemoForOwner(sb, ownerId);

    const today = localDateKey();
    const overdueKey = daysFromNow(-7);
    const tomorrowKey = daysFromNow(1);
    const nextWeekKey = daysFromNow(7);

    const portalToken =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `demo-portal-${ownerId}`;

    // ── Clients ──────────────────────────────────────────────────────────────

    const clientInsert = async (payload: Record<string, unknown>) => {
      const full = await sb.from("clients").insert({ ...payload, is_demo: true }).select("id").single();
      if (!full.error && full.data?.id) return full.data.id as string;
      // Fallback: minimal shape without optional columns
      const minimal = await sb
        .from("clients")
        .insert({ owner_id: payload.owner_id, full_name: payload.full_name, is_demo: true })
        .select("id")
        .single();
      if (!minimal.error && minimal.data?.id) return minimal.data.id as string;
      return null;
    };

    const c1Id = await clientInsert({
      owner_id: ownerId,
      full_name: "Alex Johnson",
      email: "demo-client@servlo.com.au",
      phone: "0412 345 678",
      company_name: "Johnson Properties",
      abn: "12 345 678 901",
      address: "12 Example Street",
      suburb: "Adelaide",
      state: "SA",
      postcode: "5000",
      notes: "Demo client — replace with your real clients",
      client_type: "customer",
      status: "active",
      source: "referral",
      portal_token: portalToken
    });

    const c2Id = await clientInsert({
      owner_id: ownerId,
      full_name: "Riverview Supplies",
      email: "orders@riverviewsupplies.com.au",
      phone: "0387 654 321",
      company_name: "Riverview Supplies Pty Ltd",
      abn: "98 765 432 109",
      suburb: "Melbourne",
      state: "VIC",
      postcode: "3000",
      notes: "Demo supplier for purchase orders",
      client_type: "supplier",
      status: "active",
      source: "other"
    });

    const c3Id = await clientInsert({
      owner_id: ownerId,
      full_name: "Sarah Chen",
      email: "sarah.chen@example.com",
      phone: "0455 987 654",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
      notes: "Demo lead — follow up this week",
      client_type: "lead",
      status: "active",
      source: "website"
    });

    if (!c1Id) {
      console.error("[seed-owner-demo] all client inserts failed");
      return { ok: false, message: "Failed to insert demo clients" };
    }

    // ── Employees ─────────────────────────────────────────────────────────────

    const empInsert = async (payload: Record<string, unknown>) => {
      const res = await sb.from("employees").insert({ ...payload, is_demo: true }).select("id").single();
      if (!res.error && res.data?.id) return res.data.id as string;
      // fallback without optional columns
      const min = await sb
        .from("employees")
        .insert({ owner_id: payload.owner_id, full_name: payload.full_name, email: payload.email, is_demo: true })
        .select("id")
        .single();
      return min.data?.id ? (min.data.id as string) : null;
    };

    const emp1Id = await empInsert({
      owner_id: ownerId,
      full_name: "Sam Taylor",
      email: "demo-employee@servlo.com.au",
      phone: "0423 456 789",
      role: "Field Technician"
    });

    const emp2Id = await empInsert({
      owner_id: ownerId,
      full_name: "Jordan Lee",
      email: "demo-employee2@servlo.com.au",
      phone: "0434 567 890",
      role: "Senior Technician"
    });

    if (!emp1Id) {
      console.error("[seed-owner-demo] employee inserts failed");
      return { ok: false, message: "Failed to insert demo employees" };
    }

    // ── Jobs ─────────────────────────────────────────────────────────────────

    const jobInsert = async (payload: Record<string, unknown>) => {
      const res = await sb.from("jobs").insert({ ...payload, is_demo: true }).select("id").single();
      if (!res.error && res.data?.id) return res.data.id as string;
      // fallback without optional columns
      const min = await sb
        .from("jobs")
        .insert({
          owner_id: payload.owner_id,
          client_id: payload.client_id,
          title: payload.title,
          status: payload.status ?? "scheduled",
          priority: "normal",
          is_demo: true
        })
        .select("id")
        .single();
      return min.data?.id ? (min.data.id as string) : null;
    };

    const job1Id = await jobInsert({
      owner_id: ownerId,
      client_id: c1Id,
      employee_id: emp1Id,
      title: "Residential Service Call",
      description: "Demo job — inspect and service main unit",
      status: "in_progress",
      priority: "normal",
      scheduled_date: today
    });

    const job2Id = await jobInsert({
      owner_id: ownerId,
      client_id: c1Id,
      employee_id: emp2Id,
      title: "Annual Maintenance Visit",
      description: "Demo job — scheduled annual check",
      status: "scheduled",
      priority: "normal",
      scheduled_date: tomorrowKey
    });

    const job3Id = await jobInsert({
      owner_id: ownerId,
      client_id: c3Id,
      title: "New Client Assessment",
      description: "Demo job — initial site assessment",
      status: "completed",
      priority: "high",
      scheduled_date: overdueKey
    });

    // ── Invoices ─────────────────────────────────────────────────────────────

    const invBase = { owner_id: ownerId, is_demo: true };

    await sb.from("invoices").insert([
      {
        ...invBase,
        client_id: c1Id,
        invoice_number: "INV-00001",
        status: "unpaid",
        subtotal: 772.73,
        gst: 77.27,
        total: 850.00,
        issue_date: overdueKey,
        due_date: overdueKey
      },
      {
        ...invBase,
        client_id: c1Id,
        invoice_number: "INV-00002",
        status: "paid",
        subtotal: 454.55,
        gst: 45.45,
        total: 500.00,
        issue_date: daysFromNow(-30),
        due_date: daysFromNow(-14)
      },
      {
        ...invBase,
        client_id: c3Id,
        invoice_number: "INV-00003",
        status: "draft",
        subtotal: 1136.36,
        gst: 113.64,
        total: 1250.00,
        issue_date: today,
        due_date: nextWeekKey
      }
    ]);

    // ── Quotes ────────────────────────────────────────────────────────────────

    await sb.from("quotes").insert([
      {
        owner_id: ownerId,
        client_id: c1Id,
        quote_number: "QTE-00001",
        status: "draft",
        subtotal: 1136.36,
        gst: 113.64,
        total: 1250.00,
        is_demo: true
      },
      {
        owner_id: ownerId,
        client_id: c3Id,
        quote_number: "QTE-00002",
        status: "sent",
        subtotal: 681.82,
        gst: 68.18,
        total: 750.00,
        is_demo: true
      }
    ]);

    // ── Purchase order ────────────────────────────────────────────────────────

    if (c2Id) {
      try {
        await sb.from("purchase_orders").insert({
          owner_id: ownerId,
          po_number: "PO-00001",
          supplier_client_id: c2Id,
          job_id: job1Id ?? null,
          status: "sent",
          total: 320.00,
          notes: "Demo PO — materials for residential service call",
          is_demo: true
        });
      } catch {
        // Non-fatal if purchase_orders table doesn't have is_demo column yet
      }
    }

    // ── Timesheets ────────────────────────────────────────────────────────────

    if (emp1Id) {
      const tsRows: Array<{ employee_id: string; clock_in_at: string; clock_out_at: string; is_demo: boolean }> = [
        { employee_id: emp1Id, clock_in_at: `${overdueKey}T08:00:00+10:00`, clock_out_at: `${overdueKey}T16:30:00+10:00`, is_demo: true },
        { employee_id: emp1Id, clock_in_at: `${today}T07:45:00+10:00`, clock_out_at: `${today}T15:00:00+10:00`, is_demo: true }
      ];
      if (emp2Id) {
        tsRows.push({ employee_id: emp2Id, clock_in_at: `${overdueKey}T09:00:00+10:00`, clock_out_at: `${overdueKey}T17:00:00+10:00`, is_demo: true });
      }
      try {
        await sb.from("timesheets").insert(tsRows);
      } catch {
        // Non-fatal if timesheets doesn't have is_demo column yet
      }
    }

    // ── SMS messages ─────────────────────────────────────────────────────────

    try {
      const smsRows = [
        {
          owner_id: ownerId,
          client_id: c1Id,
          to_number: "+61412345678",
          from_number: "+61400000001",
          message: "Hi Alex, just confirming your service call tomorrow at 9am. Let me know if anything changes.",
          direction: "outbound",
          status: "sent",
          is_stub: true,
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          owner_id: ownerId,
          client_id: c1Id,
          to_number: "+61400000001",
          from_number: "+61412345678",
          message: "Thanks, that works perfectly. See you then!",
          direction: "inbound",
          status: "received",
          is_stub: true,
          sent_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        },
        {
          owner_id: ownerId,
          client_id: c3Id ?? c1Id,
          to_number: "+61455987654",
          from_number: "+61400000001",
          message: "Hi Sarah, your quote is ready. Check your email or reply here with any questions.",
          direction: "outbound",
          status: "sent",
          is_stub: true,
          sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      await sb.from("sms_messages").insert(smsRows);
    } catch {
      // Non-fatal — table may not exist yet in this environment
    }

    console.log("[seed-owner-demo] finished OK for owner", ownerId);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[seed-owner-demo] unexpected error:", e);
    return { ok: false, message: msg };
  }
}
