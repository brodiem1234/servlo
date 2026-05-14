"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is there really no lock-in?",
    a: "No contracts, no minimum terms. Cancel any time from Settings → Billing in one click. Your data exports as a full ZIP file whenever you want it. We even have migration guides to competing platforms. We're that confident you'll stay."
  },
  {
    q: "What's the difference between the 30-day trial and early adopter pricing?",
    a: "30-day trial: start free, card charged on day 31 at full price. Early adopter: pay $7.25/mo now (75% off), that rate is locked for 3 months then goes to $29/mo. If you want to try first, do the trial. If you're ready to commit and want the cheapest total cost, do early adopter."
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. Open servlo.app in your phone browser and add it to your home screen. It works like an app. Native iOS App Store and Android Play Store apps are coming Q3 2026."
  },
  {
    q: "Can I connect Xero?",
    a: "Yes. Connect Xero in Settings → Integrations. Invoices, clients, and payments sync automatically. MYOB integration is in beta."
  },
  {
    q: "How does my team access it?",
    a: "You invite team members by email from the Team page. They create their own account, get linked to your business, and see only what they need. Solo plan is owner-only. Team plan ($79/mo) adds unlimited team members."
  },
  {
    q: "Is SERVLO Australian?",
    a: "Built in Adelaide, South Australia by Brodie McDonald. ABN: 88 688 301 684. Prices in AUD. GST handled correctly. BAS-ready exports. Compliance forms for AU trades included."
  },
  {
    q: "What trades does SERVLO work for?",
    a: "Any service business that does job-based work: plumbers, electricians, cleaners, landscapers, HVAC, pest control, handymen, builders, and more. If you quote jobs, schedule crew, and invoice clients, SERVLO is built for you."
  },
  {
    q: "Do I need to sign a contract?",
    a: "No. SERVLO is month-to-month. Cancel any time from Settings in under 10 seconds. No notice period, no cancellation fee, no phone call required."
  },
  {
    q: "Can my team use it?",
    a: "Yes. The Solo plan is 1 user. Team and Business plans include unlimited users. Each team member gets their own login with role-based permissions: employees see jobs and timesheets; only you see financials and reports."
  },
  {
    q: "Is my data stored in Australia?",
    a: "Yes. SERVLO uses Supabase with Australian data residency. Your data never leaves AU. We comply with the Australian Privacy Act and the Privacy (Enhancing Online Safety) Act."
  },
  {
    q: "When are the other products coming?",
    a: "Core and Grow are live now. Leads launches Q4 2026. Other products on the roadmap will follow as our customer base grows. We want to nail each product before launching the next."
  }
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-gray-200 dark:divide-white/10">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-5 text-left"
            aria-expanded={open === i}
          >
            <span className="text-base font-semibold text-gray-900 dark:text-white">{faq.q}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-gray-400 dark:text-slate-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <p className="pb-5 text-sm leading-relaxed text-gray-600 dark:text-slate-300">{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
