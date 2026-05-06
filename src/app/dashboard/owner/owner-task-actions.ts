"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireOwner() {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");
  return { sb, user };
}

export async function addOwnerTask(formData: FormData) {
  const { sb, user } = await requireOwner();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await sb.from("owner_tasks").insert({
    owner_id: user.id,
    title,
    done: false,
    sort_order: Date.now() % 1_000_000
  });

  revalidatePath("/dashboard/owner");
}

export async function toggleOwnerTask(formData: FormData) {
  const { sb, user } = await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: row } = await sb.from("owner_tasks").select("done").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!row) return;

  await sb.from("owner_tasks").update({ done: !row.done }).eq("id", id).eq("owner_id", user.id);
  revalidatePath("/dashboard/owner");
}

export async function deleteOwnerTask(formData: FormData) {
  const { sb, user } = await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await sb.from("owner_tasks").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/dashboard/owner");
}
