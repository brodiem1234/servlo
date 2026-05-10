"use client";

import { useState, useTransition } from "react";

type Job = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_date: string | null;
  address: string | null;
  suburb: string | null;
  notes: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  total: number | null;
  status: string | null;
  due_date: string | null;
  stripe_payment_link?: string | null;
};

type Quote = {
  id: string;
  quote_number: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
  public_token?: string | null;
  expiry_date?: string | null;
};

type Business = {
  business_name: string | null;
  phone: string | null;
  email: string | null;
  accent_colour: string | null;
  google_review_url: string | null;
  logo_url?: string | null;
} | null;

type Props = {
  client: { id: string; full_name: string | null; email: string | null };
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  business: Business;
  token: string;
  acceptQuoteAction: (formData: FormData) => Promise<void>;
  declineQuoteAction: (formData: FormData) => Promise<void>;
  requestServiceAction: (formData: FormData) => Promise<{ ok: boolean }>;
};

const JOB_STEPS = ["Booked", "Scheduled", "In Progress", "Completed"] as const;

function statusToStep(status: string | null): number {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return 0;
    case "scheduled":
      return 1;
    case "in_progress":
      return 2;
    case "completed":
    case "done":
      return 3;
    default:
      return 0;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number | null): string {
  return `$${Number(amount ?? 0).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function InvoiceStatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  if (s === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#15803d]">
        Paid
      </span>
    );
  }
  if (s === "overdue") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-xs font-medium text-[#dc2626]">
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-medium text-[#a16207]">
      Unpaid
    </span>
  );
}

function QuoteStatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  if (s === "accepted") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#15803d]">
        Accepted
      </span>
    );
  }
  if (s === "declined") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-xs font-medium text-[#dc2626]">
        Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-medium text-[#a16207]">
      Pending
    </span>
  );
}

function JobProgressBar({
  status,
  accent,
}: {
  status: string | null;
  accent: string;
}) {
  const activeStep = statusToStep(status);
  return (
    <div className="mt-3">
      <div className="flex items-center gap-0">
        {JOB_STEPS.map((step, i) => {
          const isActive = i <= activeStep;
          const isLast = i === JOB_STEPS.length - 1;
          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-colors"
                  style={{
                    backgroundColor: isActive ? accent : "#cbd5e1",
                  }}
                >
                  {i + 1}
                </div>
                {!isLast && (
                  <div
                    className="h-1 flex-1 transition-colors"
                    style={{
                      backgroundColor: i < activeStep ? accent : "#e2e8f0",
                    }}
                  />
                )}
              </div>
              <span
                className="mt-1 text-center text-[10px] font-medium leading-tight"
                style={{
                  color: isActive ? accent : "#94a3b8",
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PortalClient({
  client,
  jobs,
  invoices,
  quotes,
  business,
  token,
  acceptQuoteAction,
  declineQuoteAction,
  requestServiceAction,
}: Props) {
  const accent = business?.accent_colour ?? "#3B82F6";
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeJobs = jobs.filter(
    (j) =>
      (j.status ?? "").toLowerCase() !== "completed" &&
      (j.status ?? "").toLowerCase() !== "cancelled" &&
      (j.status ?? "").toLowerCase() !== "done"
  );
  const completedJobs = jobs.filter(
    (j) =>
      (j.status ?? "").toLowerCase() === "completed" ||
      (j.status ?? "").toLowerCase() === "done"
  );

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    startTransition(async () => {
      const result = await requestServiceAction(formData);
      if (result.ok) {
        setRequestSuccess(true);
        setShowRequestForm(false);
      }
    });
  }

  const displayName = client.full_name ?? client.email ?? "there";

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ "--portal-accent": accent } as React.CSSProperties}
    >
      {/* Header */}
      <header className="border-b border-[#e2e8f0] bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1e293b]">
                {business?.business_name ?? "Client Portal"}
              </h1>
              <p className="mt-0.5 text-xs text-[#94a3b8]">Powered by SERVLO</p>
            </div>
          </div>
          <p className="mt-3 text-base text-[#475569]">
            Welcome back,{" "}
            <span className="font-semibold text-[#1e293b]">{displayName}</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Active Jobs */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#1e293b]">
            Your Active Jobs
          </h2>
          {activeJobs.length === 0 ? (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#64748b]">No active jobs at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#1e293b]">
                      {job.title ?? "Untitled Job"}
                    </p>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {(job.status ?? "pending")
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                  {(job.address || job.suburb) && (
                    <p className="mt-1 text-sm text-[#64748b]">
                      {[job.address, job.suburb].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {job.scheduled_date && (
                    <p className="mt-1 text-sm text-[#94a3b8]">
                      Scheduled: {formatDate(job.scheduled_date)}
                    </p>
                  )}
                  <JobProgressBar status={job.status} accent={accent} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Request New Service */}
        <section>
          {requestSuccess && (
            <div className="mb-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-sm text-[#15803d]">
              Your service request has been submitted. We'll be in touch soon.
            </div>
          )}
          {!showRequestForm ? (
            <button
              onClick={() => {
                setShowRequestForm(true);
                setRequestSuccess(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-semibold transition-colors hover:opacity-80"
              style={{
                borderColor: accent,
                color: accent,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Request a new service
            </button>
          ) : (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-[#1e293b]">
                  Request a New Service
                </h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-sm text-[#94a3b8] hover:text-[#64748b]"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#374151]">
                    Service type
                  </label>
                  <select
                    name="service_type"
                    required
                    className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": accent,
                      } as React.CSSProperties
                    }
                  >
                    <option value="">Select a service…</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Landscaping">Landscaping</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#374151]">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe what you need done…"
                    className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#1e293b] placeholder-[#9ca3af] focus:outline-none focus:ring-2"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#374151]">
                      Preferred date
                    </label>
                    <input
                      type="date"
                      name="preferred_date"
                      className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#374151]">
                      Urgency
                    </label>
                    <select
                      name="urgency"
                      className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2"
                    >
                      <option value="flexible">Flexible</option>
                      <option value="this_week">This week</option>
                      <option value="urgent">Today (Urgent)</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {isPending ? "Submitting…" : "Submit Request"}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Invoices */}
        {invoices.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1e293b]">
              Invoices
            </h2>
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const isPaid =
                  (invoice.status ?? "").toLowerCase() === "paid";
                return (
                  <div
                    key={invoice.id}
                    className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1e293b]">
                          {invoice.invoice_number ?? "Invoice"}
                        </p>
                        <p className="mt-0.5 text-sm text-[#64748b]">
                          {formatCurrency(invoice.total)}
                          {invoice.due_date && (
                            <span className="ml-2 text-[#94a3b8]">
                              Due {formatDate(invoice.due_date)}
                            </span>
                          )}
                        </p>
                      </div>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!isPaid && invoice.stripe_payment_link ? (
                        <a
                          href={invoice.stripe_payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                          style={{ backgroundColor: accent }}
                        >
                          Pay Now
                        </a>
                      ) : !isPaid ? (
                        <span className="inline-flex items-center rounded-lg border border-[#d1d5db] bg-[#f1f5f9] px-3 py-1.5 text-xs font-medium text-[#94a3b8]">
                          Payment link coming
                        </span>
                      ) : null}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803d]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          Paid in full
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quotes */}
        {quotes.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1e293b]">
              Quotes
            </h2>
            <div className="space-y-3">
              {quotes.map((quote) => {
                const s = (quote.status ?? "").toLowerCase();
                const isPending = s !== "accepted" && s !== "declined";
                return (
                  <div
                    key={quote.id}
                    className={`rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-opacity ${
                      !isPending ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1e293b]">
                          {quote.quote_number ?? "Quote"}
                        </p>
                        <p className="mt-0.5 text-sm text-[#64748b]">
                          {formatCurrency(quote.total)}
                          {quote.created_at && (
                            <span className="ml-2 text-[#94a3b8]">
                              {formatDate(quote.created_at)}
                            </span>
                          )}
                        </p>
                      </div>
                      <QuoteStatusBadge status={quote.status} />
                    </div>
                    {quote.expiry_date && isPending && (
                      <p className="mt-1 text-xs text-[#94a3b8]">
                        Expires {formatDate(quote.expiry_date)}
                      </p>
                    )}
                    {isPending && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quote.public_token ? (
                          <a
                            href={`/q/${quote.public_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                            style={{ backgroundColor: accent }}
                          >
                            View &amp; Sign Quote
                          </a>
                        ) : (
                          <>
                            <form action={acceptQuoteAction}>
                              <input type="hidden" name="quote_id" value={quote.id} />
                              <input type="hidden" name="token" value={token} />
                              <button
                                type="submit"
                                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                                style={{ backgroundColor: "#22c55e" }}
                              >
                                Accept
                              </button>
                            </form>
                            <form action={declineQuoteAction}>
                              <input type="hidden" name="quote_id" value={quote.id} />
                              <input type="hidden" name="token" value={token} />
                              <button
                                type="submit"
                                className="rounded-lg border border-[#d1d5db] bg-white px-4 py-1.5 text-xs font-semibold text-[#ef4444] transition-colors hover:bg-[#fee2e2]"
                              >
                                Decline
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1e293b]">
              Completed Jobs
            </h2>
            <div className="space-y-3">
              {completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
                >
                  <p className="font-semibold text-[#1e293b]">
                    {job.title ?? "Untitled Job"}
                  </p>
                  {job.scheduled_date && (
                    <p className="mt-0.5 text-sm text-[#64748b]">
                      {formatDate(job.scheduled_date)}
                    </p>
                  )}
                  {job.notes && (
                    <p className="mt-2 text-sm text-[#64748b]">{job.notes}</p>
                  )}
                </div>
              ))}
            </div>
            {business?.google_review_url && (
              <a
                href={business.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: accent }}
              >
                Leave us a Google review
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            )}
          </section>
        )}

        {/* Contact */}
        {(business?.phone || business?.email) && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1e293b]">
              Contact Us
            </h2>
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {business?.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ backgroundColor: accent }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l1.06-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call us
                  </a>
                )}
                {business?.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f8fafc]"
                    style={{
                      borderColor: accent,
                      color: accent,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email us
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-8 border-t border-[#e2e8f0] py-6">
        <p className="text-center text-xs text-[#94a3b8]">
          Powered by{" "}
          <span className="font-semibold text-[#64748b]">SERVLO</span>
        </p>
      </footer>
    </div>
  );
}
