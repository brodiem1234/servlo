/**
 * Invoice validation schemas.
 * NOTE: Install zod (npm install zod) for richer schema validation.
 */

export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type CreateInvoiceInput = {
  client_id: string;
  job_id?: string | null;
  line_items: LineItem[];
  notes?: string | null;
  due_date?: string | null;
};

function isUUID(v: unknown): boolean {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function validateCreateInvoice(data: unknown): { ok: true; data: CreateInvoiceInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!d.client_id || !isUUID(d.client_id)) errors.push("client_id must be a valid UUID");
  if (d.job_id !== undefined && d.job_id !== null && !isUUID(d.job_id)) errors.push("job_id must be a valid UUID");
  if (!Array.isArray(d.line_items) || d.line_items.length === 0) errors.push("line_items must be a non-empty array");
  if (Array.isArray(d.line_items) && d.line_items.length > 100) errors.push("line_items must have ≤100 items");
  if (d.notes !== undefined && typeof d.notes === "string" && d.notes.length > 5000) errors.push("notes must be ≤5000 chars");

  if (Array.isArray(d.line_items)) {
    d.line_items.forEach((item: unknown, i: number) => {
      if (!item || typeof item !== "object") { errors.push(`line_items[${i}] is invalid`); return; }
      const li = item as Record<string, unknown>;
      if (!li.description || typeof li.description !== "string") errors.push(`line_items[${i}].description is required`);
      if (typeof li.quantity !== "number" || li.quantity < 0) errors.push(`line_items[${i}].quantity must be ≥0`);
      if (typeof li.unit_price !== "number" || li.unit_price < 0) errors.push(`line_items[${i}].unit_price must be ≥0`);
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      client_id: d.client_id as string,
      job_id: (d.job_id as string | null | undefined) ?? null,
      line_items: (d.line_items as LineItem[]).map((li) => ({
        description: String(li.description).trim().slice(0, 500),
        quantity: Number(li.quantity),
        unit_price: Number(li.unit_price),
        total: Number(li.total ?? li.quantity * li.unit_price),
      })),
      notes: typeof d.notes === "string" ? d.notes.trim().slice(0, 5000) : null,
      due_date: (d.due_date as string | null | undefined) ?? null,
    },
  };
}
