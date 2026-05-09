"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is there really no lock-in?",
    a: "No contracts, no minimum terms. Cancel any time from Settings → Billing in one click. Your data exports as a full ZIP file whenever you want it. We even have migration guides to competing platforms — we’re that confident you’ll stay."
  },
  {
    q: "What’s the difference between the 30-day trial and early adopter pricing?",
    a: "30-day trial: start free, card charged on day 31 at full price. Early adopter: pay $9.75/mo now (75% off), that rate is locked for 3 months then goes to $39/mo. If you want to try first, do the trial. If you’re ready to commit and want the cheapest total cost, do early adopter."
  },
  {
    q: "Does it work on mobile?",
    a: "Yes — open servlo.com.au in your phone browser and add it to your home screen. It works like an app. Native iOS App Store and Android Play Store apps are coming Q3 2026."
  },
  {
    q: "Can I connect Xero?",
    a: "Yes — connect Xero in Settings → Integrations. Invoices, clients, and payments sync automatically. MYOB integration is in beta."
  },
  {
    q: "How does my team access it?",
    a: "You invite team members by email from the Team page. They create their own account, get linked to your business, and see only what they need. Solo plan is owner-only. Team plan ($89/mo) adds unlimited team members."
  },
  {
    q: "Is SERVLO Australian?",
    a: "Built in Adelaide, South Australia by Brodie McDonald. ABN: 88 688 301 684. Prices in AUD. GST handled correctly. BAS-ready exports. Compliance forms for AU trades included."
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
