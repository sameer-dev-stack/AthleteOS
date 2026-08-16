"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resolvePlan } from "@/lib/referral-reward";

export type SystemNotification = {
  id: string;
  type: "inquiry" | "tip" | "referral" | "system" | "milestone" | "published";
  title: string;
  message: string;
  createdAt: string;
  link?: string;
  read?: boolean;
};

export async function getSystemNotifications(): Promise<{
  ok: boolean;
  data?: SystemNotification[];
  unreadCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch user profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id, username, full_name, profile_published, plan, referral_code, created_at, extended_pro_until, pro_expires_at, stripe_subscription_id")
      .eq("id", user.id)
      .single();

    const notifications: SystemNotification[] = [];

    // 1. Fetch recent inquiries
    const { data: inquiries } = await admin
      .from("inquiries")
      .select("id, sender_name, sender_company, inquiry_type, created_at")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (inquiries && inquiries.length > 0) {
      inquiries.forEach((inq) => {
        const company = inq.sender_company ? ` (${inq.sender_company})` : "";
        notifications.push({
          id: `inquiry-${inq.id}`,
          type: "inquiry",
          title: "New Brand Inquiry",
          message: `${inq.sender_name}${company} sent a ${inq.inquiry_type} request.`,
          createdAt: inq.created_at,
          link: "/dashboard/nil",
        });
      });
    }

    // 2. Fetch recent tips
    const { data: tips } = await admin
      .from("tips")
      .select("id, amount, net_amount, sender_name, created_at")
      .eq("athlete_id", user.id)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(5);

    if (tips && tips.length > 0) {
      tips.forEach((t) => {
        const sender = t.sender_name || "A fan";
        notifications.push({
          id: `tip-${t.id}`,
          type: "tip",
          title: "New Fan Tip Received",
          message: `${sender} sent you a $${(t.net_amount / 100).toFixed(2)} tip!`,
          createdAt: t.created_at,
          link: "/dashboard/billing",
        });
      });
    }

    // 3. Fetch recent payout activity
    const { data: payouts } = await admin
      .from("payouts")
      .select("id, amount, status, created_at, arrival_date")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (payouts && payouts.length > 0) {
      payouts.forEach((p) => {
        const isPaid = p.status === "paid";
        notifications.push({
          id: `payout-${p.id}`,
          type: "tip",
          title: isPaid ? "PayPal Payout Completed 🎉" : "PayPal Withdrawal Requested",
          message: isPaid
            ? `Your withdrawal of $${(p.amount / 100).toFixed(2)} was sent to your PayPal account!`
            : `Your request to withdraw $${(p.amount / 100).toFixed(2)} to PayPal is processing.`,
          createdAt: p.created_at,
          link: "/dashboard/billing",
        });
      });
    }

    // 4. Fetch referrals if referral_code exists
    if (profile?.referral_code) {
      const { data: referrals } = await admin
        .from("profiles")
        .select("id, full_name, username, created_at")
        .eq("referred_by_code", profile.referral_code)
        .order("created_at", { ascending: false })
        .limit(3);

      if (referrals && referrals.length > 0) {
        referrals.forEach((ref) => {
          const name = ref.full_name || ref.username || "A fellow athlete";
          notifications.push({
            id: `ref-${ref.id}`,
            type: "referral",
            title: "New Referral Joined",
            message: `${name} joined NIL CARD using your link! You earned Pro rewards.`,
            createdAt: ref.created_at,
            link: "/dashboard/referrals",
          });
        });
      }
    }

    // 4. Milestone / System Notifications
    if (profile) {
      // Pro Offer / Plan Status
      if (resolvePlan(profile.plan, profile.extended_pro_until, profile.pro_expires_at, profile.stripe_subscription_id) === "pro") {
        notifications.push({
          id: "sys-pro-active",
          type: "milestone",
          title: "Pro Access Active ⚡",
          message: "You have full access to custom themes, brand outreach AI, and advanced analytics.",
          createdAt: profile.created_at,
          link: "/dashboard/billing",
        });
      } else {
        notifications.push({
          id: "sys-launch-promo",
          type: "milestone",
          title: "First 500 Promo Available 🎉",
          message: "Claim 3 free months of NIL CARD Pro today with verified card setup.",
          createdAt: new Date().toISOString(),
          link: "/dashboard/billing",
        });
      }

      // Card Live vs Draft Status
      if (profile.profile_published) {
        notifications.push({
          id: "sys-card-live",
          type: "published",
          title: "Athlete Card Live 🚀",
          message: `Your card is live at nilcard.app/${profile.username || ""}. Share it to get inquiries!`,
          createdAt: profile.created_at,
          link: `/${profile.username}`,
        });
      } else {
        notifications.push({
          id: "sys-card-draft",
          type: "system",
          title: "Publish Your Card",
          message: "Your profile is in draft mode. Toggle it live to start accepting brand deals.",
          createdAt: profile.created_at,
          link: "/dashboard/profile",
        });
      }

      // Welcome Notification
      notifications.push({
        id: "sys-welcome",
        type: "system",
        title: "Welcome to NIL CARD",
        message: "Your NIL Business Operating System is configured and ready.",
        createdAt: profile.created_at,
        link: "/dashboard",
      });
    }

    // Sort by created_at descending
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      ok: true,
      data: notifications,
      unreadCount: notifications.length,
    };
  } catch (err) {
    console.error("[getSystemNotifications] error:", err);
    return { ok: false, error: "Failed to fetch notifications" };
  }
}
