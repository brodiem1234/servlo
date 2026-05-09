import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase.from("grow_referrals").select("id, referred_name, referred_email, referred_phone, status, reward_type, reward_amount, referral_code, created_at").eq("owner_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ referrals: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ referrals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { referred_name, referred_email, referred_phone, reward_type, reward_amount, referral_code } = body;
  if (!referred_name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const { data, error } = await supabase.from("grow_referrals").insert({ owner_id: user.id, referred_name: referred_name.trim(), referred_email: referred_email || null, referred_phone: referred_phone || null, reward_type: reward_type || null, reward_amount: reward_amount ? Number(reward_amount) : null, referral_code: referral_code || null, status: "pending" }).select("id, referred_name, referred_email, referred_phone, status, reward_type, reward_amount, referral_code, created_at").single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ referral: data }, { status: 201 });
}
