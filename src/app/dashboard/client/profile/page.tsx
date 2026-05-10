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
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--text-secondary)]">Full name</dt>
            <dd className="font-medium text-[var(--text-primary)]">{profile?.full_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Email</dt>
            <dd className="font-medium text-[var(--text-primary)]">{profile?.email ?? user.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Phone</dt>
            <dd className="font-medium text-[var(--text-primary)]">{profile?.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Business</dt>
            <dd className="font-medium text-[var(--text-primary)]">{profile?.business_name ?? "-"}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

