"use client";

import { useCallback, useState } from "react";

type Emp = { id: string; label: string };

type Props = {
  weekStartIso: string;
  daysIso: string[];
  dayLabels: string[];
  employees: Emp[];
  contractors: Emp[];
  hourLookup: Record<string, number>;
  saveHoursAction: (formData: FormData) => Promise<void>;
};

function lookupKey(employeeId: string, dateIso: string) {
  return `${employeeId}|${dateIso}`;
}

function TimesheetGrid({
  daysIso,
  dayLabels,
  people,
  hourLookup,
  saveHoursAction,
  emptyText,
}: {
  daysIso: string[];
  dayLabels: string[];
  people: Emp[];
  hourLookup: Record<string, number>;
  saveHoursAction: (formData: FormData) => Promise<void>;
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left">
            <th className="sticky left-0 z-10 bg-[var(--bg-secondary)] px-2 py-2 font-semibold text-[var(--text-primary)]">
              Person
            </th>
            {dayLabels.map((label, idx) => (
              <th key={daysIso[idx]} className="px-1 py-2 text-center text-xs font-semibold text-[var(--text-muted)]">
                {label}
              </th>
            ))}
            <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">Week</th>
          </tr>
        </thead>
        <tbody>
          {people.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-[var(--text-muted)]">
                {emptyText}
              </td>
            </tr>
          ) : (
            people.map((emp) => {
              let weekSum = 0;
              return (
                <tr key={emp.id} className="border-b border-[var(--border)]">
                  <td className="sticky left-0 z-10 bg-[var(--bg-card)] px-2 py-2 font-medium text-[var(--text-primary)]">
                    {emp.label}
                  </td>
                  {daysIso.map((d) => {
                    const hours = hourLookup[lookupKey(emp.id, d)] ?? 0;
                    weekSum += hours;
                    return (
                      <td key={d} className="px-1 py-1 align-middle">
                        <form action={saveHoursAction} className="flex justify-center">
                          <input type="hidden" name="employee_id" value={emp.id} />
                          <input type="hidden" name="work_date" value={d} />
                          <input
                            name="hours"
                            type="number"
                            step="0.25"
                            min={0}
                            max={24}
                            defaultValue={hours || ""}
                            className="w-16 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-1 py-1 text-center text-xs"
                            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                          />
                        </form>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-right font-semibold text-[var(--text-primary)]">{weekSum.toFixed(2)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function OwnerTimesheetsClient({
  weekStartIso,
  daysIso,
  dayLabels,
  employees,
  contractors,
  hourLookup,
  saveHoursAction
}: Props) {
  const [activeTab, setActiveTab] = useState<"employees" | "contractors">("employees");

  const exportCsv = useCallback(() => {
    const allPeople = [...employees.map(e => ({ ...e, type: "Employee" })), ...contractors.map(c => ({ ...c, type: "Contractor" }))];
    const header = ["Person", "Type", ...daysIso, "Week total"];
    const lines = [header.join(",")];
    for (const person of allPeople) {
      let rowSum = 0;
      const cells = daysIso.map((d) => {
        const h = hourLookup[lookupKey(person.id, d)] ?? 0;
        rowSum += h;
        return String(h);
      });
      lines.push([JSON.stringify(person.label), JSON.stringify(person.type), ...cells, String(rowSum)].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${weekStartIso}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [employees, contractors, daysIso, hourLookup, weekStartIso]);

  const tabs: Array<{ id: "employees" | "contractors"; label: string; count: number }> = [
    { id: "employees", label: "Employees", count: employees.length },
    { id: "contractors", label: "Contractors", count: contractors.length },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Tab buttons */}
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-[var(--accent-color)] text-[var(--accent-color)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
              {tab.count > 0 ? (
                <span className="ml-1.5 rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
        >
          Export CSV
        </button>
      </div>

      {activeTab === "employees" ? (
        <TimesheetGrid
          daysIso={daysIso}
          dayLabels={dayLabels}
          people={employees}
          hourLookup={hourLookup}
          saveHoursAction={saveHoursAction}
          emptyText="Add employees to build timesheets."
        />
      ) : (
        <TimesheetGrid
          daysIso={daysIso}
          dayLabels={dayLabels}
          people={contractors}
          hourLookup={hourLookup}
          saveHoursAction={saveHoursAction}
          emptyText="Add contractors in the Contractors page to track their hours here."
        />
      )}
    </>
  );
}
