"use server";

import { createClient } from "@/lib/supabase/server";

export type BusinessSummary = {
  tipsThisWeek: number; // in dollars
  tipsTotal: number; // in dollars
  wonDealsThisWeek: number; // in dollars
  wonDealsTotal: number; // in dollars
  totalMoneyThisWeek: number; // tipsThisWeek + wonDealsThisWeek
  totalDealsWonCount: number;
  pipeline: {
    new: number;
    replied: number;
    negotiating: number;
    won: number;
    lost: number;
  };
};

export async function getBusinessSummary(): Promise<{ ok: boolean; data?: BusinessSummary; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch tips for the athlete (using RLS: auth.uid() = athlete_id)
    const { data: tipsData, error: tipsErr } = await supabase
      .from("tips")
      .select("amount, net_amount, created_at, status")
      .eq("athlete_id", user.id)
      .eq("status", "succeeded");

    if (tipsErr) console.warn("[business] Error fetching tips:", tipsErr.message);

    // 2. Fetch inquiries for the athlete (using RLS: auth.uid() = athlete_id)
    // NOTE: nil_deals is explicitly EXCLUDED per ADR-047 (compliance reporting only)
    const { data: inquiriesData, error: inqErr } = await supabase
      .from("inquiries")
      .select("id, status, deal_value, created_at, won_at")
      .eq("athlete_id", user.id);

    if (inqErr) console.warn("[business] Error fetching inquiries:", inqErr.message);

    const tipsList = tipsData || [];
    const inqList = inquiriesData || [];

    // Tips Calculations (tips.amount is stored in CENTS, convert to DOLLARS)
    let tipsTotalCents = 0;
    let tipsThisWeekCents = 0;

    for (const t of tipsList) {
      const amt = t.net_amount ?? t.amount ?? 0;
      tipsTotalCents += amt;
      if (t.created_at >= sevenDaysAgo) {
        tipsThisWeekCents += amt;
      }
    }

    const tipsTotal = tipsTotalCents / 100;
    const tipsThisWeek = tipsThisWeekCents / 100;

    // Inquiries / Deals Calculations (inquiries.deal_value is stored in DOLLARS)
    let wonDealsTotal = 0;
    let wonDealsThisWeek = 0;
    let totalDealsWonCount = 0;

    const pipeline = {
      new: 0,
      replied: 0,
      negotiating: 0,
      won: 0,
      lost: 0,
    };

    for (const i of inqList) {
      const st = i.status as keyof typeof pipeline;
      if (st in pipeline) {
        pipeline[st]++;
      }

      if (st === "won") {
        totalDealsWonCount++;
        const val = Number(i.deal_value) || 0;
        wonDealsTotal += val;
        // Window on won_at timestamp, falling back to created_at when won_at is null (legacy rows)
        const wonTimestamp = i.won_at || i.created_at;
        if (wonTimestamp >= sevenDaysAgo) {
          wonDealsThisWeek += val;
        }
      }
    }

    const totalMoneyThisWeek = tipsThisWeek + wonDealsThisWeek;

    return {
      ok: true,
      data: {
        tipsThisWeek,
        tipsTotal,
        wonDealsThisWeek,
        wonDealsTotal,
        totalMoneyThisWeek,
        totalDealsWonCount,
        pipeline,
      },
    };
  } catch (err) {
    console.error("[business] getBusinessSummary error:", err);
    return { ok: false, error: "Failed to load business summary" };
  }
}
