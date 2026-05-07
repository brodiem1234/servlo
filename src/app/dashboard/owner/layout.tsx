import DashboardOwnerShellLayout from "../owner-shell-layout";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#080f1e", minHeight: "100vh" }}>
      <DashboardOwnerShellLayout>{children}</DashboardOwnerShellLayout>
    </div>
  );
}
