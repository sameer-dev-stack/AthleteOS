"use client";

import { Check, ExternalLink } from "lucide-react";

interface ServiceStatus {
  name: string;
  detail: string;
}

const SERVICES: ServiceStatus[] = [
  { name: "Supabase", detail: "Auth + Database" },
  { name: "Stripe Billing", detail: "Subscriptions + Checkout" },
  { name: "Stripe Connect", detail: "Athlete payouts (tips)" },
  { name: "Resend", detail: "Transactional email" },
  { name: "Gemini AI", detail: "AI toolkit (5 tools)" },
];

type AdminSettingsProps = {
  user?: { email: string; id: string };
};

export function AdminSettings({ user }: AdminSettingsProps) {
  return (
    <div className="space-y-6">
      {user && (
        <div>
          <h3 className="text-sm font-medium text-white">Admin Account</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Signed in as {user.email}
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-white">Platform Status</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Connected services and integrations
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((svc) => (
          <div
            key={svc.name}
            className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0D0D0F] p-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Check className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">{svc.name}</div>
              <div className="text-xs text-ink-muted">{svc.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] pt-6">
        <h3 className="text-sm font-medium text-white">Admin Access</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Authorized admin accounts
        </p>
        <div className="mt-3 rounded-lg border border-white/[0.06] bg-[#0D0D0F] p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm text-white">sameer@athleteos.app</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
              Primary
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-6">
        <h3 className="text-sm font-medium text-white">Quick Links</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Operational dashboards
        </p>
        <div className="mt-3 space-y-2">
          <a
            href="/stripe/status"
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0D0D0F] p-3 text-sm text-white transition-colors hover:bg-white/[0.04]"
          >
            <ExternalLink className="h-4 w-4 text-ink-muted" />
            Stripe Webhook Status
          </a>
          <a
            href="https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0D0D0F] p-3 text-sm text-white transition-colors hover:bg-white/[0.04]"
          >
            <ExternalLink className="h-4 w-4 text-ink-muted" />
            Supabase Dashboard
          </a>
          <a
            href="https://vercel.com/sameer-projects/athlete-os/deployments"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0D0D0F] p-3 text-sm text-white transition-colors hover:bg-white/[0.04]"
          >
            <ExternalLink className="h-4 w-4 text-ink-muted" />
            Vercel Deployments
          </a>
        </div>
      </div>
    </div>
  );
}
