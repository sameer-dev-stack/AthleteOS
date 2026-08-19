"use server";

import { getGa4Overview, getGa4Realtime } from "@/lib/ga4";

export type Ga4Metric = {
  title: string;
  value: string | number;
  icon?: string;
};

export type Ga4Response = {
  dateRange: string;
  metrics: Ga4Metric[];
  topPages: { page: string; views: number }[];
  topCountries: { country: string; users: number }[];
  devices: { device: string; users: number }[];
};

export async function getGa4Data(days = 30): Promise<{ ok: boolean; data?: Ga4Response; error?: string }> {
  try {
    const data = await getGa4Overview(days);
    return { ok: true, data };
  } catch (err) {
    console.error("[ga4] getGa4Data failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getGa4RealtimeUsers(): Promise<{ ok: boolean; data?: { activeUsers: number }; error?: string }> {
  try {
    const data = await getGa4Realtime();
    return { ok: true, data };
  } catch (err) {
    console.error("[ga4] getGa4RealtimeUsers failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
