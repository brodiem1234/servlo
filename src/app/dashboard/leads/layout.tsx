import LeadsShell from "@/components/dashboard/leads-shell";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#120b00", minHeight: "100vh" }}>
      <LeadsShell>{children}</LeadsShell>
    </div>
  );
}
