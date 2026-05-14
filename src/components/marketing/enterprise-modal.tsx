"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Check, Loader2 } from "lucide-react";

interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MESSAGE_MIN_WORDS = 20;
const NAME_MIN_WORDS = 2;
const BUSINESS_MIN_CHARS = 2;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function EnterpriseModal({ isOpen, onClose }: EnterpriseModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setName("");
        setEmail("");
        setBusinessName("");
        setTeamSize("");
        setMessage("");
        setLoading(false);
        setSuccess(false);
        setError(null);
        setFieldErrors({});
        setSubmitted(false);
      }, 300);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const messageWords = useMemo(() => wordCount(message), [message]);
  const nameWords = useMemo(() => wordCount(name), [name]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Your name is required.";
    else if (nameWords < NAME_MIN_WORDS) errs.name = `Please enter your full name (at least ${NAME_MIN_WORDS} words).`;
    if (!email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errs.email = "Please enter a valid email address.";
    if (!businessName.trim()) errs.businessName = "Business name is required.";
    else if (businessName.trim().length < BUSINESS_MIN_CHARS) errs.businessName = `Business name must be at least ${BUSINESS_MIN_CHARS} characters.`;
    if (!teamSize) errs.teamSize = "Please select a team size.";
    if (!message.trim()) errs.message = "Please tell us about your requirements.";
    else if (messageWords < MESSAGE_MIN_WORDS) errs.message = `Please write at least ${MESSAGE_MIN_WORDS} words (currently ${messageWords}).`;
    return errs;
  }

  const errs = useMemo(() => validate(), [name, email, businessName, teamSize, message, nameWords, messageWords]); // eslint-disable-line react-hooks/exhaustive-deps
  const isFormValid = Object.keys(errs).length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const v = validate();
    setFieldErrors(v);
    if (Object.keys(v).length > 0) {
      setError("Please complete all required fields before submitting.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enterprise/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          businessName: businessName.trim(),
          teamSize,
          message: message.trim()
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  // Show field errors only after the user has attempted to submit.
  const showErr = (field: string): string | undefined => (submitted ? fieldErrors[field] : undefined);

  const inputBase =
    "w-full rounded-lg border bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-neutral-500";
  const inputOk = "border-neutral-700 focus:border-white focus:ring-1 focus:ring-white/30";
  const inputErr = "border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/30";
  const cls = (field: string) => `${inputBase} ${showErr(field) ? inputErr : inputOk}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="enterprise-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-neutral-700 bg-neutral-950 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {success ? (
          /* Success state */
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">
              Thanks, {name.split(" ")[0]}!
            </h2>
            <p className="mb-6 text-sm text-neutral-400">
              Brodie will be in touch within 24 hours to discuss your requirements.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/40 bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-900 hover:border-white/60"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="mb-5">
              <h2 id="enterprise-modal-title" className="text-xl font-bold text-white">
                Enterprise enquiry
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Tell us about your business and team. We&apos;ll get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Your name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cls("name")}
                  placeholder="Jane Smith"
                  required
                  aria-invalid={Boolean(showErr("name"))}
                />
                {showErr("name") ? (
                  <p className="mt-1 text-xs text-red-400">{showErr("name")}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Email address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cls("email")}
                  placeholder="jane@company.com.au"
                  required
                  aria-invalid={Boolean(showErr("email"))}
                />
                {showErr("email") ? (
                  <p className="mt-1 text-xs text-red-400">{showErr("email")}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Business name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={cls("businessName")}
                  placeholder="Acme Services Pty Ltd"
                  required
                  aria-invalid={Boolean(showErr("businessName"))}
                />
                {showErr("businessName") ? (
                  <p className="mt-1 text-xs text-red-400">{showErr("businessName")}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Team size <span className="text-red-400">*</span>
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className={cls("teamSize")}
                  required
                  aria-invalid={Boolean(showErr("teamSize"))}
                >
                  <option value="">Select team size...</option>
                  <option value="2-10">2 to 10 people</option>
                  <option value="10-25">10 to 25 people</option>
                  <option value="25-50">25 to 50 people</option>
                  <option value="50-100">50 to 100 people</option>
                  <option value="100+">100+ people</option>
                </select>
                {showErr("teamSize") ? (
                  <p className="mt-1 text-xs text-red-400">{showErr("teamSize")}</p>
                ) : null}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-300">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <span className={`text-xs font-medium ${messageWords >= MESSAGE_MIN_WORDS ? "text-emerald-400" : "text-neutral-500"}`}>
                    {messageWords} / {MESSAGE_MIN_WORDS} minimum
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className={`${cls("message")} resize-none`}
                  placeholder="Tell us about your specific requirements, integrations, team structure, or anything else we should know..."
                  required
                  aria-invalid={Boolean(showErr("message"))}
                />
                {showErr("message") ? (
                  <p className="mt-1 text-xs text-red-400">{showErr("message")}</p>
                ) : null}
              </div>

              {error && (
                <p className="rounded-lg bg-red-950/40 border border-red-700/50 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/40 bg-black py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-900 hover:border-white/60 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send enquiry"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
