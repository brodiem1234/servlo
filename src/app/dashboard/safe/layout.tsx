import SafeShell from "@/components/dashboard/safe-shell";

export default function SafeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#120303", minHeight: "100vh" }}>
      <SafeShell>{children}</SafeShell>
    </div>
  );
}
