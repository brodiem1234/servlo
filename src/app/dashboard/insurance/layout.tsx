import InsuranceShell from "@/components/dashboard/insurance-shell";

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#120408", minHeight: "100vh" }}>
      <InsuranceShell>{children}</InsuranceShell>
    </div>
  );
}
