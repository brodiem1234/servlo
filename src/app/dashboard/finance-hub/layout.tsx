import FinanceHubShell from "@/components/dashboard/finance-hub-shell";

export default function FinanceHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#07071a", minHeight: "100vh" }}>
      <FinanceHubShell>{children}</FinanceHubShell>
    </div>
  );
}
