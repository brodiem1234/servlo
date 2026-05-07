import PayShell from "@/components/dashboard/pay-shell";

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#041209", minHeight: "100vh" }}>
      <PayShell>{children}</PayShell>
    </div>
  );
}
