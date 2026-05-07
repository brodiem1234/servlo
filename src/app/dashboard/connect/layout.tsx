import ConnectShell from "@/components/dashboard/connect-shell";

export const metadata = { title: "SERVLO CONNECT" };

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return <ConnectShell>{children}</ConnectShell>;
}
