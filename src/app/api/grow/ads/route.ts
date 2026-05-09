import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase
    .from("grow_ad_campaigns")
    .select("id, name, platform, objective, status, budget_daily, budget_total, spend, impressions, clicks, conversions, start_date, end_date, ad_copy, targeting, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ campaigns: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, platform, objective, budget_daily, budget_total, start_date, end_date, ad_copy, targeting, status } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const { data, error } = await supabase
    .from("grow_ad_campaigns")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      platform: platform || "google",
      objective: objective || null,
      status: status || "draft",
      budget_daily: budget_daily ? Number(budget_daily) : null,
      budget_total: budget_total ? Number(budget_total) : null,
      start_date: start_date || null,
      end_date: end_date || null,
      ad_copy: ad_copy || {},
      targeting: targeting || {},
    })
    .select("id, name, platform, objective, status, budget_daily, budget_total, spend, impressions, clicks, conversions, start_date, end_date, created_at")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaign: data }, { status: 201 });
}
