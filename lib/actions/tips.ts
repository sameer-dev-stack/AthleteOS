"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type TipEarnings = {
  totalEarned: number;
  totalTips: number;
  averageTip: number;
  lastTipAt: string | null;
  lastTipAmount: number | null;
  lastTipFrom: string | null;
  recentTips: {
    id: string;
    amount: number;
    netAmount: number;
    senderName: string | null;
    createdAt: string;
  }[];
};

export async function getTipEarnings(): Promise<{
  ok: boolean;
  data?: TipEarnings;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tips, error } = await admin
      .from("tips")
      .select("id, amount, net_amount, sender_name, created_at")
      .eq("athlete_id", user.id)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const allTips = tips || [];
    const totalEarned = allTips.reduce((sum, t) => sum + t.net_amount, 0);
    const totalTips = allTips.length;
    const averageTip = totalTips > 0 ? Math.round(totalEarned / totalTips) : 0;

    return {
      ok: true,
      data: {
        totalEarned,
        totalTips,
        averageTip,
        lastTipAt: allTips[0]?.created_at || null,
        lastTipAmount: allTips[0]?.net_amount || null,
        lastTipFrom: allTips[0]?.sender_name || null,
        recentTips: allTips.slice(0, 5).map((t) => ({
          id: t.id,
          amount: t.amount,
          netAmount: t.net_amount,
          senderName: t.sender_name,
          createdAt: t.created_at,
        })),
      },
    };
  } catch (err) {
    console.error("[tips] getTipEarnings error:", err);
    return { ok: false, error: "Failed to load tip earnings" };
  }
}
