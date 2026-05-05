export type UserRole = "owner" | "employee";

export function canAccessPath(role: UserRole, pathname: string) {
  if (role === "owner") return true;
  if (pathname.startsWith("/dashboard/owner")) return false;
  return true;
}
