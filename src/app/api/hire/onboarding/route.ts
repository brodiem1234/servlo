import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { task, category, due_date, employee_id } = body;
  if (!task?.trim()) return NextResponse.json({ error: "Task required" }, { status: 400 });
  const { data, error } = await supabase
    .from("onboarding_tasks")
    .insert({
      owner_id: user.id,
      task: task.trim(),
      category: category || "admin",
      due_date: due_date || null,
      employee_id: employee_id || null,
      completed: false,
    })
    .select("id, task, category, completed, due_date, employee_id")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data }, { status: 201 });
}
