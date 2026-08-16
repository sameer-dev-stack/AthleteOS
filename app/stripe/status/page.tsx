import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getStripeStatus } from "@/lib/actions/stripe-status";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StripeStatusPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAuthorized = profile?.role === "admin" || isAdmin(user.email);
  if (!isAuthorized) {
    redirect("/");
  }

  const result = await getStripeStatus();
  const data = result.ok ? result.data : null;

  function formatTimestamp(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-wide py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stripe Status</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Webhook health and recent events
            </p>
          </div>
          <SignOutButton />
        </div>

        {!data && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-400">
              {result.error || "Failed to load Stripe status"}
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
                <div className="text-sm font-medium text-ink-muted">
                  Webhook Endpoint
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      data.webhookConfigured ? "bg-accent" : "bg-red-400"
                    }`}
                  />
                  <span className="text-sm font-semibold text-white">
                    {data.webhookConfigured ? "Configured" : "Not configured"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
                <div className="text-sm font-medium text-ink-muted">
                  Total Events
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {data.totalEvents}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
                <div className="text-sm font-medium text-ink-muted">
                  Successful
                </div>
                <div className="mt-2 text-3xl font-bold text-accent">
                  {data.recentSuccesses}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
                <div className="text-sm font-medium text-ink-muted">Errors</div>
                <div
                  className={`mt-2 text-3xl font-bold ${
                    data.recentErrors.length > 0
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {data.recentErrors.length}
                </div>
              </div>
            </div>

            {data.lastEvent && (
              <div className="mb-6 rounded-xl border border-white/[0.06] bg-[#111113] p-6">
                <div className="text-sm font-medium text-ink-muted mb-3">
                  Last Event
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                    {data.lastEvent.action.replace("webhook:", "")}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {formatTimestamp(data.lastEvent.created_at)}
                  </span>
                  {data.lastEvent.target_id && (
                    <span className="text-xs text-ink-dim font-mono">
                      {data.lastEvent.target_id.slice(0, 20)}...
                    </span>
                  )}
                </div>
              </div>
            )}

            {data.recentErrors.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
                <div className="text-sm font-medium text-ink-muted mb-3">
                  Recent Errors
                </div>
                <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-[#1A1A1C]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                          Event
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                          Error
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-muted">
                          When
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {data.recentErrors.map((err) => (
                        <tr key={err.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
                              {err.action.replace("webhook:", "")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-red-400">
                            {(err.metadata as Record<string, unknown>).error
                              ? String(
                                  (err.metadata as Record<string, unknown>)
                                    .error
                                )
                              : "Unknown error"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-ink-muted">
                            {formatTimestamp(err.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data.recentErrors.length === 0 && data.totalEvents > 0 && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
                <p className="text-sm text-accent font-medium">
                  All webhook events processed successfully
                </p>
              </div>
            )}

            {data.totalEvents === 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 text-center">
                <p className="text-sm text-ink-muted">
                  No webhook events recorded yet. Events will appear here after
                  the first Stripe webhook fires.
                </p>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-white/[0.06] bg-[#111113] p-6">
              <div className="text-sm font-medium text-ink-muted mb-3">
                Configuration
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-dim">Endpoint URL</span>
                  <span className="font-mono text-white text-xs">
                    /api/stripe/webhook
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-dim">Allowed events</span>
                  <span className="text-white text-xs">
                    checkout.session.completed, customer.subscription.created,
                    customer.subscription.updated,
                    customer.subscription.deleted, invoice.payment_failed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-dim">Unknown event handling</span>
                  <span className="text-white text-xs">
                    Rejected with 400
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-dim">Audit logging</span>
                  <span className="text-white text-xs">
                    All events logged to audit_log
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
