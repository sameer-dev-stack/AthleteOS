import { redirect } from "next/navigation";

export const metadata = {
  title: "NIL Value Engine | AthleteOS",
  description: "Monitor your NIL score, recommended rates, and evaluate sponsorship deal offers.",
};

export default async function NilDashboardPage() {
  redirect("/dashboard");
}
