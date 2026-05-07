import { LockedOverlay } from "@/components/locked-overlay";
import { CheckCircle } from "lucide-react";

const ELIGIBILITY = [
  "ABN registered for 12+ months",
  "Annual turnover of $100K or more",
  "No current bankruptcy or liquidation",
  "Australian business bank account",
  "Clean credit history (no defaults in 2 years)",
];

export default function FinanceHubDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO FINANCE</h1>
          <p className="text-slate-400 mt-1">Business Lending — up to $500K, decision in 24 hours</p>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-8">
          <p className="text-3xl font-black text-indigo-300">Up to $500K</p>
          <p className="mt-2 text-sm text-slate-400">Decision in 24 hours. Competitive rates. No early repayment fees.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-base font-bold text-white">Eligibility requirements</h2>
            <ul className="space-y-3">
              {ELIGIBILITY.map((req) => (
                <li key={req} className="flex items-start gap-3">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                  <span className="text-sm text-slate-400">{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-base font-bold text-white">Loan products</h2>
            <div className="space-y-3">
              {[
                { name: "Equipment Finance", range: "$5K – $250K", rate: "From 6.9% p.a." },
                { name: "Business Loan", range: "$10K – $500K", rate: "From 8.5% p.a." },
                { name: "Overdraft Facility", range: "Up to $100K", rate: "From 7.5% p.a." },
                { name: "Invoice Finance", range: "Up to 85% of invoice", rate: "1.5% per 30 days" },
              ].map((product) => (
                <div key={product.name} className="flex items-center justify-between rounded-lg p-3 bg-indigo-500/10">
                  <div>
                    <p className="text-sm font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.range}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-300">{product.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <LockedOverlay productName="SERVLO FINANCE" launchDate="Q3 2027" accentColor="#6366F1" />
    </div>
  );
}
