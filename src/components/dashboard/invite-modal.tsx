"use client";

import { useState } from "react";
import { X, Loader2, Check } from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ROLES = [
  { value: "employee", label: "Employee", desc: "Can view and update assigned jobs" },
  { value: "contractor", label: "Contractor", desc: "External worker, limited visibility" },
  { value: "manager", label: "Manager", desc: "Can manage jobs and team members" },
];

export function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setEmail("");
    setRole("employee");
    setPersonalMessage("");
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    onClose();
    setTimeout(resetForm, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role, personalMessage: personalMessage.trim() || undefined }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error === 'invite_requires_team_plan'
          ? 'Team invitations require a Team or Business plan. Please upgrade.'
          : (data.error ?? "Something went wrong."));
      }
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
        >
          <X size={16} />
        </button>

        {success ? (
          <div className="flex flex-col items-center py-4 text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <Check size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Invitation sent!</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                We sent an invite to <strong>{email}</strong>.<br />
                They&apos;ll receive an email with a link to join.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg bg-[var(--bg-secondary)] px-6 py-2.5 text-sm font-semibold hover:bg-[var(--border)]"
              style={{ color: "var(--text-primary)" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>Invite team member</h2>
            <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Send an email invitation to join your team on SERVLO.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg,var(--bg-secondary))] px-3 text-sm focus:border-[var(--accent-color)] focus:outline-none"
                  style={{ color: "var(--text-primary)" }}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Role
                </label>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        role === r.value
                          ? "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_8%,transparent)]"
                          : "border-[var(--border)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={() => setRole(r.value)}
                        className="mt-0.5 accent-[var(--accent-color)]"
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Personal message <span style={{ color: "var(--text-muted)" }}>(optional, max 200 chars)</span>
                </label>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value.slice(0, 200))}
                  rows={3}
                  placeholder="Hey! I'd love for you to join our team on SERVLO..."
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--input-bg,var(--bg-secondary))] px-3 py-2 text-sm focus:border-[var(--accent-color)] focus:outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                <p className="mt-1 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                  {personalMessage.length}/200
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--accent-color)" }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Sending...</> : "Send invitation"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
