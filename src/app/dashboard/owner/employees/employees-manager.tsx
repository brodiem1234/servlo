"use client";

import { useState } from "react";
import { DemoBadge } from "@/components/demo-badge";

type Employee = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  trade_type: string | null;
  licences: string[] | null;
  hourly_rate: number | null;
  role: string | null;
  is_demo?: boolean | null;
};

type Props = {
  employees: Employee[];
  createEmployeeAction: (formData: FormData) => Promise<void>;
  updateEmployeeAction: (formData: FormData) => Promise<void>;
};

const licencesOptions = ["Electrical", "Plumbing", "Gas", "White Card", "Working at Heights"];

export default function EmployeesManager({
  employees,
  createEmployeeAction,
  updateEmployeeAction
}: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedLicences, setSelectedLicences] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [values, setValues] = useState({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    trade_type: "",
    hourly_rate: ""
  });

  function startAdd() {
    setEditing(false);
    setValues({ id: "", full_name: "", email: "", phone: "", trade_type: "", hourly_rate: "" });
    setSelectedLicences([]);
    setOpen(true);
  }

  function startEdit(employee: Employee) {
    setEditing(true);
    setValues({
      id: employee.id,
      full_name: employee.full_name ?? "",
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      trade_type: employee.trade_type ?? "",
      hourly_rate: String(employee.hourly_rate ?? "")
    });
    setSelectedLicences(employee.licences ?? []);
    setOpen(true);
  }

  const action = async (formData: FormData) => {
    formData.set("licences", JSON.stringify(selectedLicences));
    try {
      if (editing) await updateEmployeeAction(formData);
      else await createEmployeeAction(formData);
      setToast({ type: "success", message: editing ? "Employee updated" : "Employee added" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save employee" });
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success" ? "bg-green-50 text-[#22c55e]" : "bg-red-50 text-[#ef4444]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      <button onClick={startAdd} className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
        Add Employee
      </button>
      <article className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left text-[#1e3a5f]">
              <th className="px-2 py-2">Name</th><th className="px-2 py-2">Email</th><th className="px-2 py-2">Phone</th><th className="px-2 py-2">Trade</th><th className="px-2 py-2">Rate</th><th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const demo = Boolean(employee.is_demo);
              return (
              <tr key={employee.id} className="border-b hover:bg-[#f1f5f9]">
                <td className="px-2 py-2 font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{employee.full_name ?? "-"}</span>
                    {demo ? <DemoBadge /> : null}
                  </div>
                </td>
                <td className="px-2 py-2">{employee.email ?? "-"}</td>
                <td className="px-2 py-2">{employee.phone ?? "-"}</td>
                <td className="px-2 py-2">{employee.trade_type ?? employee.role ?? "-"}</td>
                <td className="px-2 py-2">{employee.hourly_rate != null ? `$${employee.hourly_rate}` : "-"}</td>
                <td className="px-2 py-2">
                  {!demo ? (
                    <button type="button" onClick={() => startEdit(employee)} className="rounded border px-2 py-1 text-xs">
                      Edit
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Demo — preview only</span>
                  )}
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100">{editing ? "Edit Employee" : "Add Employee"}</h2>
            <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />
              <input name="full_name" value={values.full_name} onChange={(e) => setValues((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name" className="h-10 rounded border px-3" />
              <input name="email" value={values.email} onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="h-10 rounded border px-3" />
              <input name="phone" value={values.phone} onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="h-10 rounded border px-3" />
              <input name="trade_type" value={values.trade_type} onChange={(e) => setValues((p) => ({ ...p, trade_type: e.target.value }))} placeholder="Trade type" className="h-10 rounded border px-3" />
              <input name="hourly_rate" value={values.hourly_rate} onChange={(e) => setValues((p) => ({ ...p, hourly_rate: e.target.value }))} placeholder="Hourly rate" className="h-10 rounded border px-3" />
              <div className="sm:col-span-2 rounded border p-3">
                <p className="mb-2 text-sm font-medium text-slate-300">Licences</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {licencesOptions.map((lic) => (
                    <label key={lic} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedLicences.includes(lic)}
                        onChange={(e) =>
                          setSelectedLicences((prev) =>
                            e.target.checked ? [...prev, lic] : prev.filter((x) => x !== lic)
                          )
                        }
                      />
                      {lic}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">{editing ? "Save Changes" : "Create Employee"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


