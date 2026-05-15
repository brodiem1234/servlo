import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getBusinessBrand } from "@/lib/business-brand";

/**
 * POST /api/booking/request
 * Public endpoint — no auth required (used by the booking widget).
 * Inserts a client_enquiries row and notifies the owner by email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      owner_id,
      name,
      email,
      phone,
      service_type,
      description,
      preferred_date,
      urgency,
      address,
    } = body as Record<string, string>;

    if (!owner_id || !name || !phone) {
      return NextResponse.json({ error: "owner_id, name and phone are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if a client exists with this email or phone — link if found
    let clientId: string | null = null;
    if (email) {
      const { data: existing } = await admin
        .from("clients")
        .select("id")
        .eq("owner_id", owner_id)
        .eq("email", email)
        .maybeSingle();
      if (existing) clientId = existing.id;
    }

    // Insert the enquiry. If this fails the booking is lost — bail out
    // with a 500 so the widget can show a real error to the visitor rather
    // than pretending success.
    const { error: insertError } = await admin.from("client_enquiries").insert({
      owner_id,
      client_id: clientId,
      service_type: service_type ?? "",
      description: description ?? "",
      preferred_date: preferred_date || null,
      urgency: urgency ?? "flexible",
      contact_name: name,
      contact_phone: phone,
      contact_email: email || null,
      address: address || null,
      source: "booking_widget",
    });

    if (insertError) {
      console.error("[booking/request] insert error:", insertError);
      return NextResponse.json(
        { error: "Couldn't save your request. Please try again or call the business directly." },
        { status: 500 }
      );
    }

    // Notify the owner by email (only after the row was successfully saved).
    try {
      const brand = await getBusinessBrand(owner_id);
      const { data: ownerAuth } = await admin.auth.admin.getUserById(owner_id);
      const ownerEmail = ownerAuth?.user?.email;
      if (ownerEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
        await sendEmail(
          ownerEmail,
          `New booking request from ${name}`,
          `<p>You have a new booking request via your SERVLO booking page.</p>
          <table>
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
            ${email ? `<tr><td><strong>Email</strong></td><td>${email}</td></tr>` : ""}
            <tr><td><strong>Service</strong></td><td>${service_type ?? "Not specified"}</td></tr>
            <tr><td><strong>Urgency</strong></td><td>${urgency ?? "Flexible"}</td></tr>
            ${preferred_date ? `<tr><td><strong>Preferred date</strong></td><td>${preferred_date}</td></tr>` : ""}
            ${address ? `<tr><td><strong>Address</strong></td><td>${address}</td></tr>` : ""}
            ${description ? `<tr><td><strong>Details</strong></td><td>${description}</td></tr>` : ""}
          </table>
          <p><a href="${appUrl}/dashboard/owner/clients">View in SERVLO →</a></p>`,
          `${brand.emailFromName} <${process.env.RESEND_FROM_EMAIL ?? "hello@servlo.com.au"}>`
        );
      }
    } catch { /* email notification is best-effort */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[booking/request]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
