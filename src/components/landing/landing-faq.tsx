"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — every plan starts with a 30-day free trial, no credit card required. You get full access to all features in your chosen plan so you can see real value before paying anything."
  },
  {
    q: "Can I import my existing clients and jobs?",
    a: "Absolutely. You can import clients via CSV on any plan. If you need help migrating from another platform (ServiceM8, Tradify, simPRO, etc.) our team can assist during onboarding."
  },
  {
    q: "Does SERVLO handle GST invoicing?",
    a: "Yes. All invoices are GST-ready with Australian tax settings built in. You can toggle GST on or off per line item, and PDFs are formatted to ATO requirements."
  },
  {
    q: "How do my employees access the platform?",
    a: "Employees get their own login and see only what they need — assigned jobs, schedules, and timesheets. You control permissions. They can clock in/out from any device."
  },
  {
    q: "What happens when new SERVLO products launch?",
    a: "All new products (Grow, Leads, Answer, Pay, etc.) are available to existing subscribers at no extra charge for the first 90 days after launch. Your plan price is locked in at signup."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — no lock-in, no cancellation fees. Cancel from your account settings at any time and you keep access until the end of your billing period. Your data is exportable at any point."
  }
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-white/10">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-5 text-left"
            aria-expanded={open === i}
          >
            <span className="text-base font-semibold text-white">{faq.q}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <p className="pb-5 text-sm leading-relaxed text-slate-300">{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
