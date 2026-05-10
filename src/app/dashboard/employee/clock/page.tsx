import { redirect } from "next/navigation";

/** Clock in/out is handled directly on the Home dashboard tab. */
export default function EmployeeClockPage() {
  redirect("/dashboard/employee");
}


