import LeadsShell from "@/components/dashboard/leads-shell";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return <LeadsShell>{children}</LeadsShell>;
}
