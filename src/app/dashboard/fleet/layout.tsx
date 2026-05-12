import { redirect } from "next/navigation";

// Fleet is not yet publicly available.
// Remove this redirect when Fleet launches and restore the shell.
export default function FleetLayout() {
  redirect("/dashboard/owner?notice=coming_soon");
}
