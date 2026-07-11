import Link from "next/link";
import { Users, BarChart3, Mail, ArrowRight } from "lucide-react";

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-20">
        <div className="text-center">
          <span className="eyebrow">Team Tier</span>
          <h1 className="mt-4 text-display-lg font-bold text-white">
            Manage your <span className="text-accent">entire roster</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
            Bulk onboarding, team analytics, branded team pages, and compliance support for schools, collectives, and agencies.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/teams/setup" className="btn-primary">
              Create Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Users, title: "Roster Onboarding", desc: "Bulk invite athletes to your team. They get their own cards under your branded team page." },
            { icon: BarChart3, title: "Team Analytics", desc: "See aggregate profile views, link clicks, and subscriber counts across your entire roster." },
            { icon: Mail, title: "Compliance Support", desc: "NIL deal disclosure flows, school-side approval workflows, and reporting built in." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/[0.06] bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
