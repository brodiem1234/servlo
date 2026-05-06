import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "client") redirect("/dashboard");

  return (
    <div className="dashboard-theme min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">Client Portal</p>
            <p className="text-sm text-[var(--text-secondary)]">{profile?.full_name ?? user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/client"
              className="rounded border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/client/profile"
              className="rounded border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              Profile
            </a>
            <form action={signOut}>
              <button type="submit" className="rounded bg-[#0db8c8] px-3 py-2 text-sm text-white hover:bg-[#0a9dab]">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}

