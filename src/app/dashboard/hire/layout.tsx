import HireShell from "@/components/dashboard/hire-shell";

export default function HireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#0f0700", minHeight: "100vh" }}>
      <HireShell>{children}</HireShell>
    </div>
  );
}
