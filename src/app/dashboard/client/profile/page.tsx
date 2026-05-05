import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, business_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">My Profile</h1>
      <article className="rounded-xl border bg-white p-4 shadow-sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Full name</dt>
            <dd className="font-medium text-slate-900">{profile?.full_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{profile?.email ?? user.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="font-medium text-slate-900">{profile?.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Business</dt>
            <dd className="font-medium text-slate-900">{profile?.business_name ?? "-"}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

