import AcademyShell from "@/components/dashboard/academy-shell";

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#0f0d00", minHeight: "100vh" }}>
      <AcademyShell>{children}</AcademyShell>
    </div>
  );
}
