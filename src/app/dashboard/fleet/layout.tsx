import FleetShell from "@/components/dashboard/fleet-shell";

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#020c11", minHeight: "100vh" }}>
      <FleetShell>{children}</FleetShell>
    </div>
  );
}
