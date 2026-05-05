import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/dashboard/owner";
import ClientsManager from "./clients-manager";

type ClientsPageProps = {
  searchParams?: {
    view?: string;
    sort?: string;
  };
};

export default async function OwnerClientsPage({ searchParams }: ClientsPageProps) {
  const { user } = await getOwnerContext();
  if (!user) redirect("/auth/login");

  const view = searchParams?.view === "list" ? "list" : "card";
  const sort = searchParams?.sort === "created_at" ? "created_at" : "full_name";

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, company_name, abn, address, suburb, state, postcode, notes, created_at")
    .eq("owner_id", user.id)
    .order(sort, { ascending: true });

  async function createClientAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const sb = createClient();
    const { error } = await sb.from("clients").insert({
      owner_id: owner.id,
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company_name: String(formData.get("company_name") ?? ""),
      abn: String(formData.get("abn") ?? ""),
      address: String(formData.get("address") ?? ""),
      suburb: String(formData.get("suburb") ?? ""),
      state: String(formData.get("state") ?? ""),
      postcode: String(formData.get("postcode") ?? ""),
      notes: String(formData.get("notes") ?? "")
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/clients");
  }

  async function updateClientAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const sb = createClient();
    const { error } = await sb
      .from("clients")
      .update({
        full_name: String(formData.get("full_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        company_name: String(formData.get("company_name") ?? ""),
        abn: String(formData.get("abn") ?? ""),
        address: String(formData.get("address") ?? ""),
        suburb: String(formData.get("suburb") ?? ""),
        state: String(formData.get("state") ?? ""),
        postcode: String(formData.get("postcode") ?? ""),
        notes: String(formData.get("notes") ?? "")
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/clients");
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Clients</h1>
        <div className="flex gap-2 text-sm">
          <ClientsManager
            clients={clients ?? []}
            createClientAction={createClientAction}
            updateClientAction={updateClientAction}
          />
          <a href={`/dashboard/owner/clients?view=${view}&sort=full_name`} className="rounded border bg-white px-3 py-2">
            Sort: Name
          </a>
          <a
            href={`/dashboard/owner/clients?view=${view}&sort=created_at`}
            className="rounded border bg-white px-3 py-2"
          >
            Sort: Newest
          </a>
          <a href={`/dashboard/owner/clients?view=card&sort=${sort}`} className="rounded border bg-white px-3 py-2">
            Card
          </a>
          <a href={`/dashboard/owner/clients?view=list&sort=${sort}`} className="rounded border bg-white px-3 py-2">
            List
          </a>
        </div>
      </div>

      {view === "list" ? (
        <div className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(clients ?? []).map((client) => (
                <tr key={client.id} className="border-b hover:bg-slate-50">
                  <td className="px-2 py-2 font-medium">{client.full_name ?? "-"}</td>
                  <td className="px-2 py-2">{client.email ?? "-"}</td>
                  <td className="px-2 py-2">{client.phone ?? "-"}</td>
                  <td className="px-2 py-2">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString("en-AU") : "-"}
                  </td>
                </tr>
              ))}
              {(clients ?? []).length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={4}>
                    No clients yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(clients ?? []).map((client) => (
            <article key={client.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold text-[#1e3a5f]">{client.full_name ?? "Unnamed client"}</p>
              <p className="mt-1 text-sm text-slate-600">{client.email ?? "No email"}</p>
              <p className="text-sm text-slate-600">{client.phone ?? "No phone"}</p>
            </article>
          ))}
          {(clients ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No clients yet.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

