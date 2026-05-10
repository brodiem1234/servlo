"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLOR = "#7C3AED";
const COLOR_LIGHT = "#C4B5FD";

const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";
const inputStyle = { background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const labelCls = "mb-1 block text-sm font-semibold";

export default function HirePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryType, setSalaryType] = useState("annual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Job title is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hire/postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          trade: trade || null,
          location: location || null,
          employment_type: employmentType,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          salary_type: salaryType,
          description: description || null,
        }),
      });
      const data = await res.json() as { posting?: { id: string }; error?: string };
      if (res.ok && data.posting) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/hire"), 1500);
      } else {
        setError(data.error ?? "Failed to post job");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgb(124 58 237 / 0.15)" }}>
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Job posted!</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Redirecting to Hire dashboard…</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Post a Job</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Create a listing to attract qualified tradies in your area.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgb(239 68 68 / 0.1)", color: "#F87171", border: "1px solid rgb(239 68 68 / 0.3)" }}>
            {error}
          </div>
        )}

        <div>
          <label className={labelCls} style={{ color: "var(--text-primary)" }}>Job Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Experienced Electrician needed — Sydney CBD" className={inputCls} style={inputStyle} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} style={{ color: "var(--text-primary)" }}>Trade Type</label>
            <select value={trade} onChange={(e) => setTrade(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Select trade…</option>
              <option value="electrician">Electrician</option>
              <option value="plumber">Plumber</option>
              <option value="builder">Builder</option>
              <option value="painter">Painter</option>
              <option value="landscaper">Landscaper</option>
              <option value="hvac">HVAC Technician</option>
              <option value="tiler">Tiler</option>
              <option value="carpenter">Carpenter</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-primary)" }}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Surry Hills, NSW" className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: "var(--text-primary)" }}>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, requirements, and what a typical day looks like…"
            className={inputCls}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} style={{ color: "var(--text-primary)" }}>Employment Type</label>
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="casual">Casual</option>
              <option value="contract">Contract</option>
              <option value="one_off">One-off job</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-primary)" }}>Min Rate ($)</label>
            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="e.g. 80000" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-primary)" }}>Max Rate ($)</label>
            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="e.g. 100000" className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Rate type:</label>
          {["annual", "hourly", "fixed"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSalaryType(t)}
              className="rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors"
              style={salaryType === t ? { background: "rgb(124 58 237 / 0.2)", color: COLOR_LIGHT, border: "1px solid rgb(124 58 237 / 0.4)" } : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            style={{ background: COLOR }}
          >
            {saving ? "Posting…" : "Post Job"}
          </button>
        </div>
      </form>
    </section>
  );
}
