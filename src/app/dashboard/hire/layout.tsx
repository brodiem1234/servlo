import { redirect } from "next/navigation";

// Hire is not yet publicly available.
// Remove this redirect when Hire launches and restore the shell.
export default function HireLayout() {
  redirect("/dashboard/owner?notice=coming_soon");
}
