import type { ReactNode } from "react";
import { EmployeeShell } from "./employee-shell";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return <EmployeeShell>{children}</EmployeeShell>;
}
