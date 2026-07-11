"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type ReferralStats = {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
};

export async function getReferralStats(): Promise<ReferralStats> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";

    if (!user) {
      return { referralCode: "", referralLink: "", totalReferrals: 0 };
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    const username = profile?.username || "";

    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", username);

    return {
      referralCode: username,
      referralLink: username ? `${SITE_URL}/r/${username}` : "",
      totalReferrals: count || 0,
    };
  } catch (err) {
    console.error("[referrals] getReferralStats error:", err);
    return { referralCode: "", referralLink: "", totalReferrals: 0 };
  }
}
