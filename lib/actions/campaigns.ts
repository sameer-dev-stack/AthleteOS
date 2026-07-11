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

export type CampaignStatus = "draft" | "scheduled" | "sent" | "failed";

export type Campaign = {
  id: string;
  athlete_id: string;
  name: string;
  subject: string;
  body_html: string;
  recipient_count: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
};

export type CampaignStats = {
  totalCampaigns: number;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  avgOpenRate: number;
  avgClickRate: number;
};

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(10).max(50000),
  recipientCount: z.number().int().min(1),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function createCampaign(
  name: string,
  subject: string,
  bodyHtml: string,
  recipientCount: number,
  scheduledAt: string | null = null
): Promise<{ ok: boolean; data?: Campaign; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const parsed = CreateCampaignSchema.safeParse({
      name, subject, bodyHtml, recipientCount, scheduledAt
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const svc = getServiceClient();
    const status: CampaignStatus = parsed.data.scheduledAt ? "scheduled" : "draft";

    const { data, error } = await svc
      .from("email_campaigns")
      .insert({
        athlete_id: user.id,
        name: parsed.data.name,
        subject: parsed.data.subject,
        body_html: parsed.data.bodyHtml,
        recipient_count: parsed.data.recipientCount,
        sent_count: 0,
        open_count: 0,
        click_count: 0,
        status,
        scheduled_at: parsed.data.scheduledAt || null,
        sent_at: null,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Campaign };
  } catch (err) {
    console.error("[campaigns] createCampaign error:", err);
    return { ok: false, error: "Failed to create campaign" };
  }
}

export async function getCampaigns(): Promise<{ ok: boolean; data?: Campaign[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const svc = getServiceClient();
    const { data, error } = await svc
      .from("email_campaigns")
      .select("*")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Campaign[] };
  } catch (err) {
    console.error("[campaigns] getCampaigns error:", err);
    return { ok: false, error: "Failed to load campaigns" };
  }
}

export async function sendCampaign(
  campaignId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const svc = getServiceClient();

    const { data: campaign, error: fetchErr } = await svc
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("athlete_id", user.id)
      .single();

    if (fetchErr || !campaign) return { ok: false, error: "Campaign not found" };
    if (campaign.status === "sent") return { ok: false, error: "Campaign already sent" };

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };

    const { data: subscribers, error: subErr } = await svc
      .from("fan_subscribers")
      .select("email")
      .eq("athlete_id", user.id)
      .eq("confirmed", true);

    if (subErr) return { ok: false, error: subErr.message };

    const recipients = subscribers || [];
    if (recipients.length === 0) {
      await svc
        .from("email_campaigns")
        .update({ status: "failed" as CampaignStatus, sent_at: new Date().toISOString() })
        .eq("id", campaignId);
      return { ok: false, error: "No confirmed subscribers found" };
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    let sentCount = 0;
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((sub) =>
          resend.emails.send({
            from: "AthleteOS <onboarding@resend.dev>",
            to: sub.email,
            subject: campaign.subject,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
                  <tr><td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#111113;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                      <tr><td style="padding:40px 32px 32px;">
                        ${campaign.body_html}
                      </td></tr>
                      <tr><td style="padding:0 32px 32px;">
                        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
                          <p style="color:#555557;font-size:12px;margin:0 0 8px;">
                            AthleteOS — The NIL operating system for athletes.<br>
                            <a href="${SITE_URL}" style="color:#88888A;text-decoration:underline;">athleteos.app</a>
                          </p>
                          <p style="color:#444446;font-size:11px;margin:0;">
                            <a href="${SITE_URL}/dashboard/notifications" style="color:#555557;text-decoration:underline;">Unsubscribe</a>
                          </p>
                        </div>
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </body>
              </html>
            `,
          })
        )
      );

      sentCount += results.filter((r) => r.status === "fulfilled").length;
    }

    const { error: updateErr } = await svc
      .from("email_campaigns")
      .update({
        status: "sent" as CampaignStatus,
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (updateErr) return { ok: false, error: updateErr.message };
    return { ok: true };
  } catch (err) {
    console.error("[campaigns] sendCampaign error:", err);
    return { ok: false, error: "Failed to send campaign" };
  }
}

export async function getCampaignStats(): Promise<{ ok: boolean; data?: CampaignStats; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const svc = getServiceClient();
    const { data, error } = await svc
      .from("email_campaigns")
      .select("sent_count,open_count,click_count,status")
      .eq("athlete_id", user.id);

    if (error) return { ok: false, error: error.message };

    const campaigns = data || [];
    const sentCampaigns = campaigns.filter((c) => c.status === "sent");

    const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const totalOpens = sentCampaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
    const totalClicks = sentCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);

    return {
      ok: true,
      data: {
        totalCampaigns: campaigns.length,
        totalSent,
        totalOpens,
        totalClicks,
        avgOpenRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
        avgClickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0,
      },
    };
  } catch (err) {
    console.error("[campaigns] getCampaignStats error:", err);
    return { ok: false, error: "Failed to load campaign stats" };
  }
}
