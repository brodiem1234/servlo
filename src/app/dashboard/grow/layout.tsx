import GrowShell from "@/components/dashboard/grow-shell";

export default function GrowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#0a0614", minHeight: "100vh" }}>
      <GrowShell>{children}</GrowShell>
    </div>
  );
}
