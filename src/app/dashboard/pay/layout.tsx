import { redirect } from "next/navigation";

// Pay is not yet publicly available.
// Remove this redirect when Pay launches and restore the shell.
export default function PayLayout() {
  redirect("/dashboard/owner?notice=coming_soon");
}
