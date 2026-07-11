"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type NILDeal = {
  id: string;
  athlete_id: string;
  company_name: string;
  deal_value: number; // in cents
  compensation_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: "pending" | "cleared" | "rejected";
  document_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplianceResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const discloseDealSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(100, "Company name must be 100 characters or less"),
  dealValue: z.number().min(0.01, "Deal value must be greater than zero").max(100000000, "Deal value is too high"),
  compensationType: z.string().min(1, "Compensation type is required"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  documentUrl: z.string().url("Must be a valid document URL").max(500, "Document URL must be 500 characters or less").or(z.literal("")).optional().nullable(),
});

export async function discloseDeal(rawInput: Record<string, unknown>): Promise<ComplianceResult<NILDeal>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Unauthorized" };
    }

    const validated = discloseDealSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: validated.error.errors[0].message };
    }

    const input = validated.data;
    const valueInCents = Math.round(input.dealValue * 100);

    const { data, error } = await supabase
      .from("nil_deals")
      .insert({
        athlete_id: user.id,
        company_name: input.companyName,
        deal_value: valueInCents,
        compensation_type: input.compensationType,
        description: input.description || null,
        start_date: input.startDate,
        end_date: input.endDate || null,
        document_url: input.documentUrl || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting nil deal:", error);
      return { ok: false, error: error.message || "Failed to record deal" };
    }

    revalidatePath("/dashboard/compliance");
    return { ok: true, data: data as NILDeal };
  } catch (err: unknown) {
    console.error("discloseDeal unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function getMyDeals(): Promise<ComplianceResult<NILDeal[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("nil_deals")
      .select()
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching my deals:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as NILDeal[] };
  } catch (err: unknown) {
    console.error("getMyDeals unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function updateDealStatus(
  dealId: string,
  status: "pending" | "cleared" | "rejected"
): Promise<ComplianceResult<NILDeal>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Unauthorized" };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }

    const { data, error } = await supabase
      .from("nil_deals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", dealId)
      .select()
      .single();

    if (error) {
      console.error("Error updating deal status:", error);
      return { ok: false, error: error.message };
    }

    // Write to audit log
    await supabase.from("audit_log").insert({
      admin_id: user.id,
      action: `update_deal_status_${status}`,
      target_type: "nil_deal",
      target_id: dealId,
      metadata: { deal_id: dealId, new_status: status },
    });

    revalidatePath("/dashboard/compliance");
    return { ok: true, data: data as NILDeal };
  } catch (err: unknown) {
    console.error("updateDealStatus unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}
