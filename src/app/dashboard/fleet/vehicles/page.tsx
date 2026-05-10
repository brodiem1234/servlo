"use client";

import { useState, useEffect, useCallback } from "react";

const COLOR = "#F97316";
const COLOR_LIGHT = "#FDBA74";

type Vehicle = {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  status: string | null;
  odometer_km: number | null;
  fuel_type: string | null;
  assigned_to: string | null;
};

function statusStyle(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "active" || s === "available")
    return { background: "rgb(34 197 94 / 0.15)", color: "#86EFAC" };
  if (s === "in_use" || s === "on_job")
    return { background: "rgb(249 115 22 / 0.15)", color: COLOR_LIGHT };
  if (s === "maintenance" || s === "servicing")
    return { background: "rgb(234 179 8 / 0.15)", color: "#FDE047" };
  return { background: "rgb(255 255 255 / 0.08)", color: "var(--text-muted)" };
}

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [fuelType, setFuelType] = useState("petrol");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetch("/api/fleet/vehicles")
      .then((r) => r.json())
      .then((d: { vehicles?: Vehicle[] }) => setVehicles(d.vehicles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) { showToast("Vehicle name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, make, model, year: year || undefined, registration, fuel_type: fuelType }),
      });
      const data = await res.json() as { vehicle?: Vehicle; error?: string };
      if (res.ok && data.vehicle) {
        setVehicles((prev) => [...prev, data.vehicle!]);
        showToast("Vehicle added");
        setShowAdd(false);
        setName(""); setMake(""); setModel(""); setYear(""); setRegistration(""); setFuelType("petrol");
      } else {
        showToast(data.error ?? "Failed to add vehicle");
      }
    } catch { showToast("Network error"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";
  const inputStyle = { background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider";

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Vehicles</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Manage every vehicle in your fleet.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: COLOR }}
        >
          + Add Vehicle
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>No vehicles yet.</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add your first vehicle to get started.</p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: COLOR }}
            >
              Add Vehicle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Name", "Make / Model", "Year", "Rego", "Fuel", "Odometer", "Status"].map((h) => (
                    <th key={h} className="pb-3 pt-4 pr-4 pl-5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-3 pl-5 pr-4 font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{v.name}</td>
                    <td className="py-3 pr-4 text-sm" style={{ color: "var(--text-secondary)" }}>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</td>
                    <td className="py-3 pr-4 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{v.year ?? "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{v.registration ?? "—"}</td>
                    <td className="py-3 pr-4 text-xs capitalize" style={{ color: "var(--text-muted)" }}>{v.fuel_type ?? "—"}</td>
                    <td className="py-3 pr-4 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{v.odometer_km != null ? `${v.odometer_km.toLocaleString()} km` : "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize" style={statusStyle(v.status)}>
                        {v.status ?? "active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="mb-5 text-lg font-bold" style={{ color: "var(--text-primary)" }}>Add Vehicle</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Name / Nickname *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Work Ute #1" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Make</label>
                <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Toyota" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Model</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. HiLux" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Year</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2022" min="1990" max="2030" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Registration</label>
                <input value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="e.g. ABC 123" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Fuel Type</label>
                <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                Cancel
              </button>
              <button type="button" onClick={handleAdd} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: COLOR }}>
                {saving ? "Saving…" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
          {toast}
        </div>
      )}
    </section>
  );
}
