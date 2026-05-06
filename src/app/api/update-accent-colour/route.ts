import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeAccentColour } from "@/lib/brand-accent";
import { BUSINESSES_UPSERT_ON_CONFLICT, businessesRowForOwner } from "@/lib/businesses";

function jsonErr(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  console.log('ENV CHECK:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) ?? 'MISSING'
  });

  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) {
    return jsonErr("Authorization Bearer token is required.", 401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return jsonErr("Server misconfiguration.", 500);
  }

  const verificationClient = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const {
    data: { user },
    error: authErr
  } = await verificationClient.auth.getUser();

  if (authErr || !user?.id) {
    return jsonErr(authErr?.message ?? "Unauthorized.", 401);
  }

  let body: { accentColour?: unknown };
  try {
    body = (await request.json()) as { accentColour?: unknown };
  } catch {
    return jsonErr("Invalid JSON body.", 400);
  }

  const accent_colour = normalizeAccentColour(
    typeof body.accentColour === "string" ? body.accentColour : ""
  );

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    console.error("[update-accent-colour] missing SUPABASE_SERVICE_ROLE_KEY");
    return jsonErr("Server misconfiguration.", 500);
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const updated = await supabaseAdmin
    .from("businesses")
    .update({ accent_colour })
    .eq("owner_id", user.id)
    .select("id");

  if (updated.error) {
    console.error("[update-accent-colour] update failed", updated.error);
    return jsonErr(updated.error.message ?? "Update failed.", 500);
  }

  if (!updated.data?.length) {
    const inserted = await supabaseAdmin
      .from("businesses")
      .upsert(businessesRowForOwner(user.id, { accent_colour }), {
        onConflict: BUSINESSES_UPSERT_ON_CONFLICT
      })
      .select("id");

    if (inserted.error) {
      console.error("[update-accent-colour] upsert failed", inserted.error);
      return jsonErr(inserted.error.message ?? "Could not save accent.", 500);
    }
  }

  return NextResponse.json({ success: true });
}
