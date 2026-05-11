"use client";

import { useState, useEffect, useRef } from "react";
import {
  Truck,
  Wrench,
  MapPin,
  Plus,
  Fuel,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  status: "active" | "maintenance" | "retired" | string;
  odometer_km: number | null;
  assigned_to: string | null;
  fuel_type: string | null;
}

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  service_type: string | null;
  service_date: string | null;
  next_service_date: string | null;
  next_service_km: number | null;
  cost: number | null;
}

interface Trip {
  id: string;
  vehicle_id: string;
  trip_date: string | null;
  distance_km: number | null;
  purpose: string | null;
  fuel_cost: number | null;
}

interface Stats {
  totalVehicles: number;
  activeVehicles: number;
  dueForService: number;
  fuelSpend30d: number;
}

interface Props {
  vehicles: Vehicle[];
  serviceRecords: ServiceRecord[];
  trips: Trip[];
  stats: Stats;
}

type Tab = "vehicles" | "service" | "trips" | "add_vehicle";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtOdo(km: number | null) {
  if (km == null) return "—";
  return new Intl.NumberFormat("en-AU").format(km) + " km";
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: "Active", bg: "#052e16", text: "#4ade80" },
    maintenance: { label: "Maintenance", bg: "#422006", text: "#fb923c" },
    retired: { label: "Retired", bg: "#1c1c2e", text: "#94a3b8" },
  };
  const s = map[status] ?? map.retired;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}33` }}
    >
      {s.label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error";
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl text-sm font-medium max-w-xs"
      style={{
        background: toast.type === "success" ? "#052e16" : "#450a0a",
        color: toast.type === "success" ? "#4ade80" : "#f87171",
        border: `1px solid ${toast.type === "success" ? "#16a34a55" : "#dc262655"}`,
      }}
    >
      {toast.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Add Vehicle Form ──────────────────────────────────────────────────────────

interface AddVehicleFormProps {
  onSuccess: (vehicle: Vehicle) => void;
  onCancel: () => void;
  addToast: (message: string, type: "success" | "error") => void;
}

function AddVehicleForm({ onSuccess, onCancel, addToast }: AddVehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    registration: "",
    fuel_type: "petrol",
    status: "active",
  });

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vehicle name is required";
    if (form.year) {
      const y = Number(form.year);
      if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 2) {
        e.year = "Enter a valid year (e.g. 2019)";
      }
    }
    return e;
  }

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          make: form.make.trim() || null,
          model: form.model.trim() || null,
          year: form.year ? Number(form.year) : null,
          registration: form.registration.trim() || null,
          fuel_type: form.fuel_type,
          status: form.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error ?? "Failed to add vehicle", "error");
      } else {
        addToast(`${form.name.trim()} added successfully`, "success");
        onSuccess(json.vehicle);
      }
    } catch {
      addToast("Network error — please try again", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-zinc-100 dark:bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-colors";
  const inputStyle = { borderColor: "rgba(255,255,255,0.12)" };
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Add new vehicle" className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-white">Add Vehicle</h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="veh-name" className={labelCls}>
          Vehicle Name <span aria-hidden="true" style={{ color: "#F97316" }}>*</span>
        </label>
        <input
          ref={nameRef}
          id="veh-name"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "veh-name-err" : undefined}
          placeholder="e.g. Company Ute #1"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className={`${inputCls} ${errors.name ? "border-red-500/60 focus:ring-red-500/40" : "focus:ring-orange-500/40"}`}
          style={errors.name ? {} : inputStyle}
        />
        {errors.name && (
          <p id="veh-name-err" role="alert" className="mt-1 text-xs text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Make / Model */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="veh-make" className={labelCls}>Make</label>
          <input
            id="veh-make"
            type="text"
            placeholder="e.g. Toyota"
            value={form.make}
            onChange={(e) => setField("make", e.target.value)}
            className={`${inputCls} focus:ring-orange-500/40`}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="veh-model" className={labelCls}>Model</label>
          <input
            id="veh-model"
            type="text"
            placeholder="e.g. HiLux"
            value={form.model}
            onChange={(e) => setField("model", e.target.value)}
            className={`${inputCls} focus:ring-orange-500/40`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Year / Registration */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="veh-year" className={labelCls}>Year</label>
          <input
            id="veh-year"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 2021"
            min={1900}
            max={new Date().getFullYear() + 2}
            aria-invalid={!!errors.year}
            aria-describedby={errors.year ? "veh-year-err" : undefined}
            value={form.year}
            onChange={(e) => setField("year", e.target.value)}
            className={`${inputCls} ${errors.year ? "border-red-500/60 focus:ring-red-500/40" : "focus:ring-orange-500/40"}`}
            style={errors.year ? {} : inputStyle}
          />
          {errors.year && (
            <p id="veh-year-err" role="alert" className="mt-1 text-xs text-red-400">
              {errors.year}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="veh-rego" className={labelCls}>Registration</label>
          <input
            id="veh-rego"
            type="text"
            placeholder="e.g. ABC-123"
            value={form.registration}
            onChange={(e) => setField("registration", e.target.value)}
            className={`${inputCls} font-mono focus:ring-orange-500/40`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Fuel type / Status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="veh-fuel" className={labelCls}>Fuel Type</label>
          <select
            id="veh-fuel"
            value={form.fuel_type}
            onChange={(e) => setField("fuel_type", e.target.value)}
            className={`${inputCls} focus:ring-orange-500/40 cursor-pointer`}
            style={{ ...inputStyle, colorScheme: "dark" }}
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label htmlFor="veh-status" className={labelCls}>Status</label>
          <select
            id="veh-status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            className={`${inputCls} focus:ring-orange-500/40 cursor-pointer`}
            style={{ ...inputStyle, colorScheme: "dark" }}
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "#F97316" }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              Adding…
            </>
          ) : (
            <>
              <Plus size={15} aria-hidden="true" />
              Add Vehicle
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FleetDashboard({ vehicles: initialVehicles, serviceRecords, trips, stats }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [activeTab, setActiveTab] = useState<Tab>("vehicles");
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastCounter = useRef(0);

  function addToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((t) => [...t, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function handleVehicleAdded(vehicle: Vehicle) {
    setVehicles((v) => [...v, vehicle].sort((a, b) => a.name.localeCompare(b.name)));
    setActiveTab("vehicles");
  }

  // Recompute live stats using current vehicles list
  const liveStats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v) => v.status === "active").length,
    dueForService: stats.dueForService,
    fuelSpend30d: stats.fuelSpend30d,
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "vehicles", label: "Vehicles", icon: <Truck size={14} aria-hidden="true" /> },
    { id: "service", label: "Service Log", icon: <Wrench size={14} aria-hidden="true" /> },
    { id: "trips", label: "Trip Log", icon: <MapPin size={14} aria-hidden="true" /> },
    { id: "add_vehicle", label: "+ Add Vehicle", icon: null },
  ];

  const statCards = [
    {
      label: "Total Vehicles",
      value: liveStats.totalVehicles,
      icon: <Truck size={15} />,
      highlight: false,
    },
    {
      label: "Active",
      value: liveStats.activeVehicles,
      icon: <CheckCircle2 size={15} />,
      highlight: false,
    },
    {
      label: "Due for Service",
      value: liveStats.dueForService,
      icon: <AlertTriangle size={15} />,
      highlight: liveStats.dueForService > 0,
    },
    {
      label: "Fuel Spend (30d)",
      value: fmtCurrency(liveStats.fuelSpend30d),
      icon: <Fuel size={15} />,
      highlight: false,
    },
  ];

  // Lookup vehicle name from id
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  function vehicleName(id: string) {
    const v = vehicleMap.get(id);
    if (!v) return <span className="text-slate-600 text-xs font-mono">{id.slice(0, 8)}…</span>;
    return (
      <span className="text-slate-300">
        {v.name}
        {v.registration && (
          <span className="ml-1.5 font-mono text-xs text-slate-500">{v.registration}</span>
        )}
      </span>
    );
  }

  const thCls = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
  const tdCls = "px-4 py-3 text-sm text-slate-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary, #fff)" }}>
              SERVLO FLEET
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#3a1f08", color: "#F97316", border: "1px solid #F9731633" }}
            >
              {vehicles.length > 0 ? "Live" : "Q4 2026"}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted, #94a3b8)" }}>
            Fleet &amp; asset management — service reminders, trip log &amp; fuel tracking
          </p>
        </div>
        <button
          onClick={() => setActiveTab("add_vehicle")}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#F97316" }}
          aria-label="Add a vehicle"
        >
          <Plus size={15} aria-hidden="true" />
          Add Vehicle
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Fleet statistics">
        {statCards.map(({ label, value, icon, highlight }) => (
          <div
            key={label}
            role="listitem"
            className="flex flex-col gap-2 rounded-xl p-5"
            style={{
              background: "var(--bg-card, rgba(255,255,255,0.05))",
              border: highlight
                ? "1px solid #f59e0b55"
                : "1px solid var(--border, rgba(255,255,255,0.1))",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted, #64748b)" }}>
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: highlight ? "#78350f33" : "#F9731615", color: highlight ? "#f59e0b" : "#F97316" }}
                aria-hidden="true"
              >
                {icon}
              </span>
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: highlight ? "#fbbf24" : "var(--text-primary, #fff)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Due for service alert */}
      {liveStats.dueForService > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl px-5 py-3"
          style={{ background: "#422006", border: "1px solid #f59e0b44" }}
          role="status"
          aria-label="Service due alert"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "#fbbf24" }} />
          <p className="text-sm" style={{ color: "#fde68a" }}>
            <span className="font-semibold">{liveStats.dueForService} vehicle{liveStats.dueForService > 1 ? "s" : ""}</span>{" "}
            {liveStats.dueForService > 1 ? "are" : "is"} due for service within the next 30 days. Check the Service Log tab.
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="flex gap-1 rounded-xl p-1 overflow-x-auto"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border, rgba(255,255,255,0.1))" }}
        role="tablist"
        aria-label="Fleet sections"
      >
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors flex-1 justify-center"
            style={
              activeTab === id
                ? { background: "#F97316", color: "#fff" }
                : { color: "var(--text-secondary, #94a3b8)" }
            }
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Vehicles tab ────────────────────────────────────────────────────── */}
      <div
        id="tabpanel-vehicles"
        role="tabpanel"
        aria-labelledby="tab-vehicles"
        hidden={activeTab !== "vehicles"}
      >
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl py-16 px-6 text-center"
            style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px dashed var(--border, rgba(255,255,255,0.1))" }}>
            <Truck size={40} className="mb-4" style={{ color: "#F97316", opacity: 0.4 }} aria-hidden="true" />
            <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary, #fff)" }}>No vehicles yet</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted, #94a3b8)" }}>
              Add your first vehicle to start tracking odometer, services, and trips.
            </p>
            <button
              onClick={() => setActiveTab("add_vehicle")}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#F97316" }}
            >
              <Plus size={15} aria-hidden="true" />
              Add Vehicle
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Vehicle list">
            {vehicles.map((v) => (
              <article
                key={v.id}
                role="listitem"
                className="group rounded-xl p-5 space-y-4 transition-colors hover:border-orange-500/30"
                style={{
                  background: "var(--bg-card, rgba(255,255,255,0.05))",
                  border: "1px solid var(--border, rgba(255,255,255,0.1))",
                }}
                aria-label={`Vehicle: ${v.name}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "#F9731615" }}
                      aria-hidden="true"
                    >
                      <Truck size={16} style={{ color: "#F97316" }} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: "var(--text-primary, #fff)" }}>
                        {v.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted, #94a3b8)" }}>
                        {[v.year, v.make, v.model].filter(Boolean).join(" ") || "No details"}
                      </p>
                    </div>
                  </div>
                  {statusBadge(v.status)}
                </div>

                {/* Registration badge */}
                {v.registration && (
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2.5 py-1 font-mono text-sm font-bold tracking-widest"
                      style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" }}
                      aria-label={`Registration: ${v.registration}`}
                    >
                      {v.registration.toUpperCase()}
                    </span>
                    {v.fuel_type && (
                      <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted, #94a3b8)" }}>
                        {v.fuel_type}
                      </span>
                    )}
                  </div>
                )}

                {/* Odometer */}
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary, #cbd5e1)" }}>
                  <Clock size={13} style={{ color: "var(--text-muted, #64748b)" }} aria-hidden="true" />
                  <span>{fmtOdo(v.odometer_km)}</span>
                  {v.assigned_to && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>·</span>
                      <span className="truncate text-xs" style={{ color: "var(--text-muted, #94a3b8)" }}>
                        {v.assigned_to}
                      </span>
                    </>
                  )}
                </div>

                {/* View detail link placeholder */}
                <button
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--text-muted, #94a3b8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  aria-label={`View details for ${v.name}`}
                >
                  View Details
                  <ChevronRight size={13} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ── Service Log tab ──────────────────────────────────────────────────── */}
      <div
        id="tabpanel-service"
        role="tabpanel"
        aria-labelledby="tab-service"
        hidden={activeTab !== "service"}
      >
        <div className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
          {serviceRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Wrench size={36} className="mb-4" style={{ color: "#F97316", opacity: 0.35 }} aria-hidden="true" />
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary, #fff)" }}>No service records yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted, #94a3b8)" }}>
                Service records will appear here once added via the vehicle detail page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Service records">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
                    <th className={thCls}>Vehicle</th>
                    <th className={thCls}>Service Type</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Next Due</th>
                    <th className={thCls}>Next Due KM</th>
                    <th className={thCls}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRecords.map((s) => {
                    const isUpcoming =
                      s.next_service_date &&
                      new Date(s.next_service_date) <= new Date(Date.now() + 30 * 86400000) &&
                      new Date(s.next_service_date) >= new Date();
                    return (
                      <tr
                        key={s.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        className="last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className={tdCls}>{vehicleName(s.vehicle_id)}</td>
                        <td className={tdCls} style={{ color: "var(--text-primary, #fff)" }}>
                          {s.service_type ?? "—"}
                        </td>
                        <td className={tdCls}>{fmtDate(s.service_date)}</td>
                        <td className={`${tdCls}`}>
                          <span style={{ color: isUpcoming ? "#fbbf24" : undefined }}>
                            {fmtDate(s.next_service_date)}
                            {isUpcoming && (
                              <AlertTriangle size={12} className="inline ml-1 mb-0.5" aria-label="Due soon" />
                            )}
                          </span>
                        </td>
                        <td className={tdCls}>{s.next_service_km ? fmtOdo(s.next_service_km) : "—"}</td>
                        <td className={tdCls}>{s.cost != null ? fmtCurrency(s.cost) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Trip Log tab ─────────────────────────────────────────────────────── */}
      <div
        id="tabpanel-trips"
        role="tabpanel"
        aria-labelledby="tab-trips"
        hidden={activeTab !== "trips"}
      >
        <div className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MapPin size={36} className="mb-4" style={{ color: "#F97316", opacity: 0.35 }} aria-hidden="true" />
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary, #fff)" }}>No trips logged yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted, #94a3b8)" }}>
                Trip records will appear here as journeys are logged against your vehicles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Trip log">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
                    <th className={thCls}>Vehicle</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Distance</th>
                    <th className={thCls}>Purpose</th>
                    <th className={thCls}>Fuel Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr
                      key={t.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      className="last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className={tdCls}>{vehicleName(t.vehicle_id)}</td>
                      <td className={tdCls}>{fmtDate(t.trip_date)}</td>
                      <td className={`${tdCls} tabular-nums`}>
                        {t.distance_km != null
                          ? new Intl.NumberFormat("en-AU").format(t.distance_km) + " km"
                          : "—"}
                      </td>
                      <td className={tdCls} style={{ color: "var(--text-primary, #fff)" }}>
                        {t.purpose ?? "—"}
                      </td>
                      <td className={`${tdCls} tabular-nums`}>
                        {t.fuel_cost != null ? fmtCurrency(t.fuel_cost) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Vehicle tab ──────────────────────────────────────────────────── */}
      <div
        id="tabpanel-add_vehicle"
        role="tabpanel"
        aria-labelledby="tab-add_vehicle"
        hidden={activeTab !== "add_vehicle"}
      >
        <div className="max-w-lg mx-auto rounded-xl p-6"
          style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
          <AddVehicleForm
            onSuccess={handleVehicleAdded}
            onCancel={() => setActiveTab("vehicles")}
            addToast={addToast}
          />
        </div>
      </div>

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
}
