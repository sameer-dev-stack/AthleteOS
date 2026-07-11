import Link from "next/link";
import { Search, Megaphone, Handshake, ArrowRight } from "lucide-react";

export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-20">
        <div className="text-center">
          <span className="eyebrow">For Brands</span>
          <h1 className="mt-4 text-display-lg font-bold text-white">
            Find the right <span className="text-accent">athletes</span> for your brand
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
            Discover verified athletes, create campaign briefs, and manage partnerships — all from one platform.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/brands/setup" className="btn-primary">
              Create Brand Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/brands/discover" className="btn-ghost">
              Browse Athletes
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Search, title: "Athlete Discovery", desc: "Search by sport, school, audience size, and engagement. Find athletes that match your brand." },
            { icon: Megaphone, title: "Campaign Briefs", desc: "Create briefs for your campaigns. Athletes can apply and you pick the best fits." },
            { icon: Handshake, title: "Managed Partnerships", desc: "Track inquiries, manage deals, and build long-term relationships with athletes." },
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
