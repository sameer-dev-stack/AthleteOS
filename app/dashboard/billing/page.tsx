import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSubscriptionStatus } from "@/lib/actions/billing";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { BalanceOverview } from "@/components/dashboard/balance-overview";
import { createClient } from "@/lib/supabase/server";
import { getLaunchPromoStats } from "@/lib/launch-promo";
import { LaunchOfferBanner } from "@/components/promo/launch-offer-banner";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/dashboard/billing");

  const subscription = await getSubscriptionStatus();

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_claimed_promo_trial")
    .eq("id", user.id)
    .single();

  const promoStats = await getLaunchPromoStats();
  const isPro = subscription.plan === "pro" || subscription.plan === "team";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Billing & Plan</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Manage your subscription plans, monitor your monthly AI action usage limits, and unlock premium features.
        </p>
      </div>

      <div className="max-w-4xl space-y-8">
        {!isPro && promoStats.isAvailable && (
          <LaunchOfferBanner
            remainingSlots={promoStats.remainingSlots}
            totalSlots={promoStats.totalSlots}
            isAuthenticated={true}
            hasClaimed={profile?.has_claimed_promo_trial}
          />
        )}
        <BalanceOverview />
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-[#111113]" />}>
          <BillingPanel subscription={subscription} />
        </Suspense>
      </div>
    </div>
  );
}
