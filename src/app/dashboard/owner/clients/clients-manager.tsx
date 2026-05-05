"use client";

import { useState } from "react";

type ClientRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status?: string | null;
  source?: string | null;
  company_name: string | null;
  abn: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
};

type Props = {
  clients: ClientRecord[];
  createClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  updateClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

const defaultValues = {
  id: "",
  full_name: "",
  email: "",
  phone: "",
  status: "active",
  source: "other",
  company_name: "",
  abn: "",
  address: "",
  suburb: "",
  state: "",
  postcode: "",
  notes: ""
};

export default function ClientsManager({ clients, createClientAction, updateClientAction }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [values, setValues] = useState(defaultValues);

  function onAdd() {
    setEditing(false);
    setValues(defaultValues);
    setOpen(true);
  }

  function onEdit(client: ClientRecord) {
    setEditing(true);
    setValues({
      id: client.id,
      full_name: client.full_name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      status: client.status ?? "active",
      source: client.source ?? "other",
      company_name: client.company_name ?? "",
      abn: client.abn ?? "",
      address: client.address ?? "",
      suburb: client.suburb ?? "",
      state: client.state ?? "",
      postcode: client.postcode ?? "",
      notes: client.notes ?? ""
    });
    setOpen(true);
  }

  function onEditSelected() {
    const selected = clients.find((client) => client.id === selectedClientId);
    if (selected) onEdit(selected);
  }

  const action = async (formData: FormData) => {
    const result = editing ? await updateClientAction(formData) : await createClientAction(formData);
    if (result.ok) {
      setToast({ type: "success", message: editing ? "Client updated" : "Client added" });
      setOpen(false);
      return;
    }
    setToast({ type: "error", message: result.message ?? "Unable to save client" });
  };

  return (
    <>
      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <button onClick={onAdd} className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white">
          Add Client
        </button>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="h-10 rounded border bg-white px-3 text-sm"
        >
          <option value="">Select client to edit</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.full_name ?? client.email ?? "Unnamed client"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onEditSelected}
          disabled={!selectedClientId}
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
        >
          Edit Client
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">{editing ? "Edit Client" : "Add Client"}</h2>
            <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />
              {(
                [
                  ["full_name", "Full Name"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["company_name", "Company Name"],
                  ["abn", "ABN"],
                  ["address", "Address"],
                  ["suburb", "Suburb"],
                  ["state", "State"],
                  ["postcode", "Postcode"]
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    name={key}
                    value={values[key]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="h-10 w-full rounded border px-3 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium">Client Status</label>
                <select
                  name="status"
                  value={values.status}
                  onChange={(e) => setValues((prev) => ({ ...prev, status: e.target.value }))}
                  className="h-10 w-full rounded border px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Source</label>
                <select
                  name="source"
                  value={values.source}
                  onChange={(e) => setValues((prev) => ({ ...prev, source: e.target.value }))}
                  className="h-10 w-full rounded border px-3 text-sm"
                >
                  <option value="referral">Referral</option>
                  <option value="website">Website</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={values.notes}
                  onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
                  className="min-h-24 w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" className="rounded bg-[#1e3a5f] px-4 py-2 text-sm text-white">
                  {editing ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="hidden">
        {clients.length}
      </div>
    </>
  );
}


