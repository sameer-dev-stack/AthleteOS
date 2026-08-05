"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SubmitInquirySchema = z.object({
  athleteId: z.string().uuid(),
  senderName: z.string().min(1).max(100),
  senderEmail: z.string().email().max(200),
  senderCompany: z.string().max(100).optional(),
  inquiryType: z.enum(["sponsorship", "booking", "shoutout", "collab", "other"]),
  message: z.string().min(10).max(2000),
});

export async function submitInquiry(
  athleteId: string,
  senderName: string,
  senderEmail: string,
  senderCompany: string | undefined,
  inquiryType: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = SubmitInquirySchema.safeParse({
    athleteId, senderName, senderEmail, senderCompany, inquiryType, message
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = getServiceClient();
  const { error } = await supabase.from("inquiries").insert({
    athlete_id: parsed.data.athleteId,
    sender_name: parsed.data.senderName,
    sender_email: parsed.data.senderEmail,
    sender_company: parsed.data.senderCompany ?? null,
    inquiry_type: parsed.data.inquiryType,
    message: parsed.data.message,
  });

  if (error) return { ok: false, error: error.message };

  try {
    const { data: athlete } = await supabase
      .from("profiles")
      .select("email, full_name, email_preferences")
      .eq("id", parsed.data.athleteId)
      .single();

    if (athlete?.email) {
      const prefs = athlete.email_preferences as Record<string, boolean> | null;
      if (prefs?.inquiry !== false) {
        const { sendInquiryNotificationEmail } = await import("./emails");
        sendInquiryNotificationEmail(
          athlete.email,
          athlete.full_name || "there",
          parsed.data.senderName,
          parsed.data.senderCompany ?? null,
          parsed.data.inquiryType,
          parsed.data.message
        ).catch(() => {});
      }
    }
  } catch {
    // Email notification is best-effort
  }

  return { ok: true };
}

export async function getAthleteInquiries(
  page = 1,
  pageSize = 20
): Promise<{ ok: boolean; data?: Record<string, unknown>[]; total?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("inquiries")
    .select("*", { count: "exact" })
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [], total: count ?? 0 };
}

const UpdateStatusSchema = z.object({
  inquiryId: z.string().uuid(),
  status: z.enum(["new", "replied", "negotiating", "won", "lost"]),
  dealValue: z.number().min(0).nullable().optional(),
});

export async function updateInquiryStatus(
  inquiryId: string,
  status: string,
  dealValue?: number | null
): Promise<{ ok: boolean; error?: string }> {
  const parsed = UpdateStatusSchema.safeParse({ inquiryId, status, dealValue });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("athlete_id, status, won_at")
    .eq("id", parsed.data.inquiryId)
    .single();

  if (!inquiry || inquiry.athlete_id !== user.id) return { ok: false, error: "Not authorized" };

  const updates: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.dealValue !== undefined) {
    updates.deal_value = parsed.data.dealValue;
  }

  // Manage won_at timestamp: set on transition TO 'won', clear on transition AWAY FROM 'won'
  if (parsed.data.status === "won" && inquiry.status !== "won") {
    updates.won_at = new Date().toISOString();
  } else if (parsed.data.status !== "won" && inquiry.status === "won") {
    updates.won_at = null;
  }

  const { error } = await supabase
    .from("inquiries")
    .update(updates)
    .eq("id", parsed.data.inquiryId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getInquiryCount(athleteId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== athleteId) return 0;

    const serviceClient = getServiceClient();
    const { count } = await serviceClient
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athleteId)
      .eq("status", "new");
    return count ?? 0;
  } catch (err) {
    console.error("[inquiries] getInquiryCount error:", err);
    return 0;
  }
}
