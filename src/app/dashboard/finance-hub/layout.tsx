import { redirect } from "next/navigation";

// Finance Hub is not yet publicly available.
// Remove this redirect when Finance Hub launches and restore the shell.
export default function FinanceHubLayout() {
  redirect("/dashboard/owner?notice=coming_soon");
}
