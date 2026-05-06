import type { SupabaseClient } from "@supabase/supabase-js";

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
 * Column sets match owner dashboard schema; optional fallbacks handle legacy DB shapes.
 */
export async function seedOwnerDemoData(
  sb: SupabaseClient,
  ownerId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await removeAllDemoForOwner(sb, ownerId);

    const today = localDateKey();

    const { data: clientRow, error: clientErr } = await sb
      .from("clients")
      .insert({
        owner_id: ownerId,
        full_name: "Alex Johnson",
        email: "demo-client@servlo.com.au",
        phone: "0412 345 678",
        company_name: "Johnson Properties",
        abn: "",
        address: "12 Example Street",
        suburb: "Adelaide",
        state: "SA",
        postcode: "5000",
        notes: "Demo client — replace with your real clients",
        is_demo: true
      })
      .select("id")
      .single();

    if (clientErr || !clientRow?.id) {
      return { ok: false, message: clientErr?.message ?? "Failed to insert demo client" };
    }

    const clientId = clientRow.id as string;

    let employeeRow: { id: string } | null = null;
    let empErr = null;

    const empMinimal = await sb
      .from("employees")
      .insert({
        owner_id: ownerId,
        full_name: "Sam Taylor",
        email: "demo-employee@servlo.com.au",
        phone: "0423 456 789",
        role: "Field Technician",
        is_demo: true
      })
      .select("id")
      .single();

    if (!empMinimal.error && empMinimal.data?.id) {
      employeeRow = empMinimal.data as { id: string };
    } else {
      empErr = empMinimal.error;
      const empLegacy = await sb
        .from("employees")
        .insert({
          owner_id: ownerId,
          full_name: "Sam Taylor",
          email: "demo-employee@servlo.com.au",
          phone: "0423 456 789",
          role: "Field Technician",
          trade_type: "",
          licences: [],
          hourly_rate: 0,
          is_demo: true
        })
        .select("id")
        .single();

      if (!empLegacy.error && empLegacy.data?.id) {
        employeeRow = empLegacy.data as { id: string };
        empErr = null;
      } else {
        const empRoleEnum = await sb
          .from("employees")
          .insert({
            owner_id: ownerId,
            full_name: "Sam Taylor",
            email: "demo-employee@servlo.com.au",
            phone: "0423 456 789",
            role: "employee",
            trade_type: "Field Technician",
            licences: [],
            hourly_rate: 0,
            is_demo: true
          })
          .select("id")
          .single();

        if (!empRoleEnum.error && empRoleEnum.data?.id) {
          employeeRow = empRoleEnum.data as { id: string };
          empErr = null;
        } else {
          empErr = empRoleEnum.error ?? empLegacy.error ?? empErr;
        }
      }
    }

    if (!employeeRow?.id || empErr) {
      await sb.from("clients").delete().eq("id", clientId);
      return { ok: false, message: empErr?.message ?? "Failed to insert demo employee" };
    }

    const employeeId = employeeRow.id;

    const jobMinimal = {
      owner_id: ownerId,
      client_id: clientId,
      employee_id: employeeId,
      title: "Residential Service Call",
      description: "Demo job — create your first real job to get started",
      status: "in_progress",
      priority: "normal",
      scheduled_date: today,
      is_demo: true
    };

    let jobErr = null;
    const jobTry1 = await sb.from("jobs").insert(jobMinimal);
    if (jobTry1.error) {
      const jobTry2 = await sb.from("jobs").insert({
        ...jobMinimal,
        job_type: "",
        scheduled_start: null,
        scheduled_end: null,
        address: "",
        suburb: "",
        state: "",
        notes: "",
        materials_cost: 0,
        labour_hours: 0,
        hourly_rate: 0
      });
      jobErr = jobTry2.error;
    }

    if (jobErr) {
      await sb.from("employees").delete().eq("id", employeeId);
      await sb.from("clients").delete().eq("id", clientId);
      return { ok: false, message: jobErr.message ?? "Failed to insert demo job" };
    }

    const invNewShape = {
      owner_id: ownerId,
      client_id: clientId,
      invoice_number: "INV-00001",
      status: "Unpaid",
      subtotal: 772.73,
      gst: 77.27,
      total: 850.0,
      is_demo: true
    };

    const invLegacyShape = {
      owner_id: ownerId,
      client_id: clientId,
      invoice_number: "INV-00001",
      status: "unpaid",
      subtotal: 772.73,
      gst_amount: 77.27,
      amount: 850.0,
      is_demo: true
    };

    const invTry1 = await sb.from("invoices").insert(invNewShape).select("id").single();
    if (!invTry1.error && invTry1.data?.id) {
      return { ok: true };
    }

    const invTry2 = await sb.from("invoices").insert(invLegacyShape).select("id").single();
    if (!invTry2.error && invTry2.data?.id) {
      return { ok: true };
    }

    const invErr = invTry2.error ?? invTry1.error;
    await sb.from("jobs").delete().eq("owner_id", ownerId).eq("client_id", clientId).eq("is_demo", true);
    await sb.from("employees").delete().eq("id", employeeId);
    await sb.from("clients").delete().eq("id", clientId);
    return { ok: false, message: invErr?.message ?? "Failed to insert demo invoice" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
