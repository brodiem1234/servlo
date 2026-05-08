"use client";

interface FounderBadgeProps {
  founderNumber: number;
}

const FOUNDER_BENEFITS = [
  "Locked-in pricing for life",
  "Priority roadmap input",
  "Early access to all new features",
  "Permanent Founders page recognition",
  "Direct line to the SERVLO team",
];

export function FounderBadge({ founderNumber }: FounderBadgeProps) {
  return (
    <div className="relative group inline-flex items-center gap-1.5">
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold cursor-default select-none"
        style={{
          background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
          color: "#fff",
          boxShadow: "0 1px 4px rgba(217,119,6,0.4)",
        }}
      >
        <span>🏅</span>
        <span>Founding Member #{founderNumber}</span>
      </div>

      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl border border-amber-200 bg-white p-3 text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
        style={{ color: "#334155" }}
      >
        <p className="font-bold text-amber-700 mb-2">Founding Member Benefits</p>
        <ul className="space-y-1">
          {FOUNDER_BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
