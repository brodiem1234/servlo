import { redirect } from "next/navigation";

// Answer is not yet publicly available.
// Remove this redirect when Answer launches and restore the shell.
export default function AnswerLayout() {
  redirect("/dashboard/owner?notice=coming_soon");
}
