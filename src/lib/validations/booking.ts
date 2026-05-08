/**
 * Booking validation schemas.
 * NOTE: Install zod (npm install zod) for richer schema validation.
 */

export type CreateBookingInput = {
  businessId: string;
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
  notes?: string;
};

function isUUID(v: unknown): boolean {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
}

function isDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isTime(v: string): boolean {
  return /^\d{2}:\d{2}$/.test(v);
}

export function validateCreateBooking(data: unknown): { ok: true; data: CreateBookingInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!d.businessId || !isUUID(d.businessId)) errors.push("businessId must be a valid UUID");
  if (!d.serviceId || !isUUID(d.serviceId)) errors.push("serviceId must be a valid UUID");
  if (!d.date || typeof d.date !== "string" || !isDate(d.date)) errors.push("date must be YYYY-MM-DD");
  if (!d.time || typeof d.time !== "string" || !isTime(d.time)) errors.push("time must be HH:MM");
  if (!d.customerName || typeof d.customerName !== "string" || d.customerName.trim().length === 0) errors.push("customerName is required");
  if (d.customerName && typeof d.customerName === "string" && d.customerName.length > 200) errors.push("customerName must be ≤200 chars");
  if (!d.customerEmail || typeof d.customerEmail !== "string" || !isEmail(d.customerEmail)) errors.push("customerEmail is invalid");
  if (d.notes !== undefined && typeof d.notes === "string" && d.notes.length > 2000) errors.push("notes must be ≤2000 chars");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      businessId: d.businessId as string,
      serviceId: d.serviceId as string,
      date: d.date as string,
      time: d.time as string,
      customerName: (d.customerName as string).trim().slice(0, 200),
      customerEmail: (d.customerEmail as string).toLowerCase().trim(),
      customerPhone: typeof d.customerPhone === "string" ? d.customerPhone.trim().slice(0, 20) : undefined,
      address: typeof d.address === "string" ? d.address.trim().slice(0, 500) : undefined,
      notes: typeof d.notes === "string" ? d.notes.trim().slice(0, 2000) : undefined,
    },
  };
}
