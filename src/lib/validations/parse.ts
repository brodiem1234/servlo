/**
 * Generic body parser helper for API routes.
 * Returns the validated data or a 400 NextResponse with error details.
 */

import { NextResponse } from "next/server";

type ValidatorFn<T> =
  | ((data: unknown) => { ok: true; data: T } | { ok: false; errors: string[] });

export function parseBody<T>(
  validator: ValidatorFn<T>,
  data: unknown
): { data: T } | { error: NextResponse } {
  const result = validator(data);
  if (!result.ok) {
    return {
      error: NextResponse.json(
        {
          error: "Validation failed",
          details: result.errors.map((msg) => ({ message: msg })),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
