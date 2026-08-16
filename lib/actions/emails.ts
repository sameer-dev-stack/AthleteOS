"use server";

import { randomUUID } from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function emailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111113;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
            <tr><td style="padding:40px 32px 32px;">
              ${content}
            </td></tr>
            <tr><td style="padding:0 32px 32px;">
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
                <p style="color:#555557;font-size:12px;margin:0 0 8px;">
                  NIL CARD — The NIL operating system for athletes.<br>
                  <a href="${SITE_URL}" style="color:#88888A;text-decoration:underline;">nilcard.app</a>
                </p>
                <p style="color:#444446;font-size:11px;margin:0;">
                  <a href="${SITE_URL}/dashboard/notifications" style="color:#555557;text-decoration:underline;">Email preferences</a>
                </p>
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function brandBadge(): string {
  return `<span style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px;letter-spacing:0.5px;">NIL CARD</span>`;
}

export async function generateToken(): Promise<string> {
  return randomUUID();
}

export async function sendConfirmationEmail(
  email: string,
  token: string,
  confirmPath = "/api/confirm-waitlist"
): Promise<{ ok: boolean; error?: string }> {
  if (!SITE_URL) {
    return { ok: false, error: "NEXT_PUBLIC_SITE_URL is not set" };
  }
  const confirmUrl = `${SITE_URL}${confirmPath}?token=${token}`;

  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "Confirm your NIL CARD account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111113;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                  <tr>
                    <td style="padding:40px 32px 32px;">
                      <div style="margin-bottom:24px;">
                        <span style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px;letter-spacing:0.5px;">NIL CARD</span>
                      </div>
                      <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Confirm your email</h1>
                      <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 32px;">
                        Click the button below to confirm your email and finish setting up your athlete card.
                      </p>
                      <a href="${confirmUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">
                        Confirm my account
                      </a>
                      <p style="color:#555557;font-size:13px;line-height:1.5;margin:32px 0 0;">
                        If you didn't sign up for NIL CARD, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px;">
                      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
                        <p style="color:#555557;font-size:12px;margin:0;">
                          NIL CARD — The NIL operating system for athletes.<br>
                          <a href="${SITE_URL}" style="color:#88888A;text-decoration:underline;">nilcard.app</a>
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] confirmation email failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

export type WeeklyBriefingData = {
  firstName: string;
  cardViews: number;
  linkClicks: number;
  tipsTotal: number;
  nilScore: number | null;
  aiRemaining: number;
  aiLimit: number;
  actionItems: string[];
  preferredTone: string | null;
  daysOnPlatform: number;
  newInquiries: number;
  fanSubscribers: number;
  // Dynamic metrics & rates
  followersTotal: number;
  followerDelta: number;
  engagementRate: number;
  engagementDelta: number;
  rates: {
    post: { min: number; target: number; max: number };
    appearance: { min: number; target: number; max: number };
    campaign: { min: number; target: number; max: number };
  };
  aiInsight: string;
};

export async function sendWeeklyBriefing(
  email: string,
  data: WeeklyBriefingData
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  const {
    firstName,
    cardViews,
    linkClicks,
    tipsTotal,
    nilScore,
    aiRemaining,
    aiLimit,
    actionItems,
    preferredTone,
    daysOnPlatform,
    newInquiries,
    fanSubscribers,
    followersTotal,
    followerDelta,
    engagementRate,
    engagementDelta,
    rates,
    aiInsight,
  } = data;

  const scoreText = nilScore !== null ? `${nilScore}/100` : "Not calculated";
  const toneText = preferredTone ? preferredTone.charAt(0).toUpperCase() + preferredTone.slice(1) : "N/A";

  const actionItemsHtml = actionItems
    .map(
      (item, index) => `
        <li style="margin-bottom:12px;color:#FFFFFF;font-size:14px;line-height:1.5;">
          <strong style="color:#C6FF3D;">${index + 1}.</strong> ${escapeHtml(item)}
        </li>`
    )
    .join("");

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: `Your Weekly NIL CARD Briefing — NIL Score: ${scoreText}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#111113;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding:40px 40px 20px;">
                      <div style="margin-bottom:24px;">
                        <span style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:900;font-size:11px;padding:4px 10px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">NIL CARD</span>
                      </div>
                      <h1 style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0 0 8px;line-height:1.2;text-transform:uppercase;letter-spacing:-0.5px;">This week on NIL CARD</h1>
                      <p style="color:#88888A;font-size:14px;margin:0;line-height:1.5;">
                        Hey ${escapeHtml(firstName)}, here is a breakdown of your profile performance and tailored brand actions for the week.
                      </p>
                    </td>
                  </tr>

                  <!-- AI Coach Callout Insight -->
                  ${aiInsight ? `
                  <tr>
                    <td style="padding:0 40px 30px;">
                      <div style="background-color:rgba(198,255,61,0.04);border-radius:12px;border:1px solid rgba(198,255,61,0.15);padding:16px 20px;">
                        <span style="font-size:10px;color:#C6FF3D;font-weight:900;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Tailored AI Coach Insight</span>
                        <p style="color:#FFFFFF;font-size:13.5px;line-height:1.5;margin:0;font-style:italic;">
                          "${escapeHtml(aiInsight)}"
                        </p>
                      </div>
                    </td>
                  </tr>
                  ` : ""}

                  <!-- Stats Grid -->
                  <tr>
                    <td style="padding:0 40px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:20px;">
                        <tr>
                          <td width="33%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:10px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Card Views</div>
                            <div style="font-size:22px;color:#FFFFFF;font-weight:900;">${cardViews.toLocaleString()}</div>
                          </td>
                          <td width="33%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:10px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Link Clicks</div>
                            <div style="font-size:22px;color:#C6FF3D;font-weight:900;">${linkClicks.toLocaleString()}</div>
                          </td>
                          <td width="33%" align="center" style="padding:10px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Tips Earned</div>
                            <div style="font-size:22px;color:#FFFFFF;font-weight:900;">$${tipsTotal.toFixed(2)}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Audience & Engagement Row -->
                  <tr>
                    <td style="padding:0 40px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:16px 20px;">
                        <tr>
                          <td width="50%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:8px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Total Followers</div>
                            <div style="font-size:18px;color:#FFFFFF;font-weight:900;">${followersTotal.toLocaleString()}</div>
                            ${followerDelta !== 0 ? `
                              <div style="font-size:11px;color:${followerDelta >= 0 ? "#C6FF3D" : "#FF6B6B"};font-weight:700;margin-top:2px;">
                                ${followerDelta >= 0 ? "+" : ""}${followerDelta.toFixed(1)}% this week
                              </div>
                            ` : ""}
                          </td>
                          <td width="50%" align="center" style="padding:8px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Engagement Rate</div>
                            <div style="font-size:18px;color:#FFFFFF;font-weight:900;">${(engagementRate * 100).toFixed(1)}%</div>
                            ${engagementDelta !== 0 ? `
                              <div style="font-size:11px;color:${engagementDelta >= 0 ? "#C6FF3D" : "#FF6B6B"};font-weight:700;margin-top:2px;">
                                ${engagementDelta >= 0 ? "+" : ""}${engagementDelta.toFixed(1)}% this week
                              </div>
                            ` : ""}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Suggested NIL Rates Block -->
                  <tr>
                    <td style="padding:0 40px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:20px;">
                        <tr>
                          <td colspan="2" style="padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                            <span style="font-size:12px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">SUGGESTED NIL RATES</span>
                          </td>
                        </tr>
                        <tr style="color:#FFFFFF;font-size:13px;">
                          <td style="padding-top:12px;">Social Media Post:</td>
                          <td align="right" style="padding-top:12px;font-weight:700;color:#C6FF3D;">$${rates.post.min.toLocaleString()} - $${rates.post.max.toLocaleString()}</td>
                        </tr>
                        <tr style="color:#FFFFFF;font-size:13px;">
                          <td style="padding-top:8px;">In-Person Appearance:</td>
                          <td align="right" style="padding-top:8px;font-weight:700;color:#FFFFFF;">$${rates.appearance.min.toLocaleString()} - $${rates.appearance.max.toLocaleString()}</td>
                        </tr>
                        <tr style="color:#FFFFFF;font-size:13px;">
                          <td style="padding-top:8px;">Monthly Campaign:</td>
                          <td align="right" style="padding-top:8px;font-weight:700;color:#FFFFFF;">$${rates.campaign.min.toLocaleString()} - $${rates.campaign.max.toLocaleString()}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Secondary Stats -->
                  <tr>
                    <td style="padding:0 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:16px 20px;">
                        <tr>
                          <td width="50%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:8px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">New Inquiries</div>
                            <div style="font-size:18px;color:#FFFFFF;font-weight:900;">${newInquiries}</div>
                          </td>
                          <td width="50%" align="center" style="padding:8px 0;">
                            <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Fan Subscribers</div>
                            <div style="font-size:18px;color:#C6FF3D;font-weight:900;">${fanSubscribers}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- NIL Score Banner -->
                  <tr>
                    <td style="padding:0 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(198,255,61,0.03);border-radius:12px;border:1px solid rgba(198,255,61,0.15);padding:16px 20px;">
                        <tr>
                          <td>
                            <div style="font-size:11px;color:#C6FF3D;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;">Your NIL Score</div>
                            <div style="font-size:28px;color:#FFFFFF;font-weight:900;margin-top:2px;">${scoreText}</div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-size:12px;color:#88888A;font-weight:600;">Preferred Tone: <strong>${toneText}</strong></span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Action Items -->
                  <tr>
                    <td style="padding:0 40px 30px;">
                      <h3 style="color:#FFFFFF;font-size:15px;font-weight:900;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">3 Things To Do This Week</h3>
                      <ul style="margin:0;padding:0;list-style-type:none;">
                        ${actionItemsHtml}
                      </ul>
                    </td>
                  </tr>

                  <!-- Quota & Lock-in -->
                  <tr>
                    <td style="padding:0 40px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
                        <tr>
                          <td>
                            <p style="color:#555557;font-size:12px;line-height:1.5;margin:0;">
                              You have been building your card on NIL CARD for <strong>${daysOnPlatform} days</strong>.<br>
                              Our AI model has saved your preferences to refine future brand pitches.
                            </p>
                          </td>
                          <td align="right" style="vertical-align:middle;padding-left:10px;white-space:nowrap;">
                            <span style="font-size:12px;color:#88888A;font-weight:700;">
                              ${aiRemaining} of ${aiLimit} AI uses left
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] weekly briefing email failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

export async function sendPaymentFailedEmail(
  email: string,
  name: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };
  const displayName = name || "there";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "Action required: Your NIL CARD payment failed",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111113;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                <tr><td style="padding:40px 32px;">
                  <div style="margin-bottom:24px;">
                    <span style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px;letter-spacing:0.5px;">NIL CARD</span>
                  </div>
                  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F5F5F7;">Payment failed</h1>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#9A9AA3;">
                    Hey ${escapeHtml(displayName)}, we were unable to process your latest payment. Your account has been downgraded to the Free plan.
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#9A9AA3;">
                    To restore your Pro features, please update your payment method in the billing dashboard.
                  </p>
                  <a href="${SITE_URL || "https://nilcard.app"}/dashboard/billing"
                     style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    Update payment method
                  </a>
                  <p style="margin:24px 0 0;font-size:13px;color:#6B6B74;">
                    If you did not initiate this change, contact us at hey@nilcard.app.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] payment failed email error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendProUpgradeEmail(
  email: string,
  name: string | null,
  billingLabel: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };
  const displayName = name || "there";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "You're now on NIL CARD Pro",
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Pro access unlocked</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Hey ${escapeHtml(displayName)}, your NIL CARD Pro subscription is now active (${escapeHtml(billingLabel)}).
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="padding:12px 16px;background-color:#16161A;border-radius:10px;border:1px solid rgba(198,255,61,0.1);">
              <p style="color:#C6FF3D;font-size:13px;font-weight:700;margin:0 0 4px;">Keep 100% of every tip</p>
              <p style="color:#88888A;font-size:13px;margin:0;">0% platform fee — standard payment processing fees still apply.</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:12px 16px;background-color:#16161A;border-radius:10px;border:1px solid rgba(198,255,61,0.1);">
              <p style="color:#C6FF3D;font-size:13px;font-weight:700;margin:0 0 4px;">Custom theme & Gold badge</p>
              <p style="color:#88888A;font-size:13px;margin:0;">Full brand control + Gold Verified badge on your card.</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:12px 16px;background-color:#16161A;border-radius:10px;border:1px solid rgba(198,255,61,0.1);">
              <p style="color:#C6FF3D;font-size:13px;font-weight:700;margin:0 0 4px;">Advanced analytics</p>
              <p style="color:#88888A;font-size:13px;margin:0;">Full 90-day view history, referral tracking, and growth trends.</p>
            </td>
          </tr>
        </table>
        <a href="${SITE_URL}/dashboard" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">Go to dashboard</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] pro upgrade email failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendPayoutRequestedEmail(
  email: string,
  name: string | null,
  amountDollars: string,
  paypalEmail: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };
  const displayName = name || "there";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: `Payout of $${amountDollars} requested`,
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Withdrawal requested</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Hey ${escapeHtml(displayName)}, your payout request of <strong style="color:#C6FF3D;">$${escapeHtml(amountDollars)}</strong> has been submitted and is being processed.
        </p>
        <div style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:20px;margin-bottom:24px;">
          <p style="color:#88888A;font-size:13px;margin:0 0 6px;">Sending to:</p>
          <p style="color:#FFFFFF;font-size:15px;font-weight:600;margin:0;">${escapeHtml(paypalEmail)} (PayPal)</p>
        </div>
        <p style="color:#88888A;font-size:13px;line-height:1.6;margin:0 0 24px;">
          Payouts are reviewed and sent within 1-3 business days. You will receive a follow-up email when your funds are on the way.
        </p>
        <a href="${SITE_URL}/dashboard/billing" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">View payout history</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] payout requested email failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}



export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  username: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };
  const cardUrl = `${SITE_URL}/${username}`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to NIL CARD — your card is live",
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Welcome aboard, ${escapeHtml(firstName)}</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Your athlete card is live and ready to share. Here are 3 things you can do right now:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="padding:12px 16px;background-color:#16161A;border-radius:10px;border:1px solid rgba(255,255,255,0.04);margin-bottom:8px;">
              <p style="color:#C6FF3D;font-size:13px;font-weight:700;margin:0 0 4px;">1. Share your card</p>
              <p style="color:#88888A;font-size:13px;margin:0;">Send your link to friends, coaches, and brands.</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:12px 16px;background-color:#16161A;border-radius:10px;border:1px solid rgba(255,255,255,0.04);">
              <p style="color:#C6FF3D;font-size:13px;font-weight:700;margin:0 0 4px;">2. Try the AI tools</p>
              <p style="color:#88888A;font-size:13px;margin:0;">Generate a professional bio, pitch sponsors, or create captions.</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:12px 16px;background-color:#16161A;border-radius:10px;border:1px solid rgba(255,255,255,0.04);">
              <p style="color:#C6FF3D;font-size:13px;font-weight:700;margin:0 0 4px;">3. Connect Stripe</p>
              <p style="color:#88888A;font-size:13px;margin:0;">Enable tips so fans can pay you directly through your card.</p>
            </td>
          </tr>
        </table>
        <a href="${cardUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">View your card</a>
        <p style="color:#555557;font-size:13px;line-height:1.5;margin:28px 0 0;">
          Questions? Just reply to this email.
        </p>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] welcome email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendCardPublishedEmail(
  email: string,
  firstName: string,
  username: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };
  const cardUrl = `${SITE_URL}/${username}`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "Your athlete card is now live",
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Your card is public</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Hey ${escapeHtml(firstName)}, your athlete card is now live at <a href="${cardUrl}" style="color:#C6FF3D;text-decoration:none;">nilcard.app/${username}</a>. Anyone with the link can view it.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:20px;margin-bottom:28px;">
          <tr>
            <td style="padding:8px 0;">
              <p style="color:#FFFFFF;font-size:14px;font-weight:700;margin:0;">Sharing tips</p>
              <p style="color:#88888A;font-size:13px;margin:6px 0 0;line-height:1.5;">Add it to your Instagram bio, TikTok bio, and Twitter profile. Send it to coaches and brands you want to work with.</p>
            </td>
          </tr>
        </table>
        <a href="${cardUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">View your card</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] card published email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendInquiryNotificationEmail(
  athleteEmail: string,
  athleteName: string,
  senderName: string,
  senderCompany: string | null,
  inquiryType: string,
  messagePreview: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };

  const typeLabels: Record<string, string> = {
    sponsorship: "Sponsorship inquiry",
    booking: "Booking request",
    shoutout: "Shoutout request",
    collab: "Collaboration inquiry",
    other: "New inquiry",
  };
  const typeLabel = typeLabels[inquiryType] || "New inquiry";
  const companyText = senderCompany ? ` from ${senderCompany}` : "";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: athleteEmail,
      subject: `${typeLabel}: ${senderName}${companyText}`,
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <p style="color:#C6FF3D;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">${escapeHtml(typeLabel)}</p>
        <h1 style="color:#FFFFFF;font-size:20px;font-weight:700;margin:0 0 8px;line-height:1.3;">${escapeHtml(senderName)}${escapeHtml(companyText)}</h1>
        <p style="color:#88888A;font-size:14px;line-height:1.5;margin:0 0 24px;">
          ${escapeHtml(athleteName)}, you received a new inquiry on your NIL CARD card.
        </p>
        <div style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:20px;margin-bottom:24px;">
          <p style="color:#FFFFFF;font-size:14px;line-height:1.6;margin:0 0 0;white-space:pre-wrap;">${escapeHtml(messagePreview.slice(0, 500))}${messagePreview.length > 500 ? "..." : ""}</p>
        </div>
        <a href="${SITE_URL}/dashboard" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">View in dashboard</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] inquiry notification email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendTipReceivedEmail(
  athleteEmail: string,
  athleteName: string,
  senderName: string,
  amount: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: athleteEmail,
      subject: `You received a $${amount} tip`,
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Tip received</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Hey ${escapeHtml(athleteName)}, <strong style="color:#FFFFFF;">${escapeHtml(senderName)}</strong> sent you a tip of <strong style="color:#C6FF3D;">$${amount}</strong> through your NIL CARD card.
        </p>
        <a href="${SITE_URL}/dashboard/billing" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">View balance</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] tip received email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendProfileNudgeEmail(
  email: string,
  firstName: string,
  missingItems: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };

  const dashboardUrl = `${SITE_URL}/dashboard`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "Your athlete card is almost ready",
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Almost there</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Hey ${escapeHtml(firstName)}, your athlete card is almost brand-ready. Just a few things left to add:
        </p>
        <div style="margin-bottom:28px;">
          ${missingItems.map(item => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background-color:#16161A;border-radius:8px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.04);">
              <div style="width:6px;height:6px;border-radius:50%;background-color:#C6FF3D;flex-shrink:0;"></div>
              <span style="color:#CCCCCC;font-size:14px;">${escapeHtml(item)}</span>
            </div>
          `).join("")}
        </div>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Athletes with complete profiles get <strong style="color:#FFFFFF;">10x more views</strong> from brands and sponsors.
        </p>
        <a href="${dashboardUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">Complete your profile</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] profile nudge email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendCardStrengthDigest(
  email: string,
  firstName: string,
  currentScore: number,
  previousScore: number,
  suggestions: string[],
  topAction: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not set" };

  const dashboardUrl = `${SITE_URL}/dashboard`;
  const scoreDiff = currentScore - previousScore;
  const isUp = scoreDiff > 0;
  const isDown = scoreDiff < 0;
  const arrow = isUp ? "&#8593;" : isDown ? "&#8595;" : "&#8594;";
  const scoreColor = isUp ? "#22C55E" : isDown ? "#EF4444" : "#88888A";
  const diffText = isUp
    ? `+${scoreDiff} from last week`
    : isDown
      ? `${scoreDiff} from last week`
      : "No change from last week";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: `Your card strength: ${currentScore}/100`,
      html: emailLayout(`
        <div style="margin-bottom:24px;">${brandBadge()}</div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 8px;line-height:1.3;">Card Strength Digest</h1>
        <p style="color:#88888A;font-size:14px;line-height:1.6;margin:0 0 28px;">
          Hey ${escapeHtml(firstName)}, here is your bi-weekly card strength update.
        </p>

        <div style="background-color:#16161A;border-radius:16px;border:1px solid rgba(255,255,255,0.04);padding:28px;text-align:center;margin-bottom:28px;">
          <div style="font-size:56px;font-weight:800;color:#C6FF3D;line-height:1;">${currentScore}</div>
          <div style="color:#555557;font-size:12px;margin-top:4px;">out of 100</div>
          <div style="color:${scoreColor};font-size:14px;font-weight:600;margin-top:12px;">
            ${arrow} ${escapeHtml(diffText)}
          </div>
        </div>

        ${suggestions.length > 0 ? `
          <h2 style="color:#FFFFFF;font-size:15px;font-weight:600;margin:0 0 16px;">Quick wins to boost your score</h2>
          ${suggestions.slice(0, 3).map(s => `
            <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background-color:#16161A;border-radius:10px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.04);">
              <div style="width:6px;height:6px;border-radius:50%;background-color:#C6FF3D;margin-top:6px;flex-shrink:0;"></div>
              <span style="color:#CCCCCC;font-size:13px;line-height:1.5;">${escapeHtml(s)}</span>
            </div>
          `).join("")}
        ` : ""}

        ${topAction ? `
          <div style="margin-top:24px;padding:16px;background-color:rgba(198,255,61,0.06);border:1px solid rgba(198,255,61,0.2);border-radius:12px;">
            <p style="color:#C6FF3D;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Top action this week</p>
            <p style="color:#FFFFFF;font-size:14px;line-height:1.5;margin:0;">${escapeHtml(topAction)}</p>
          </div>
        ` : ""}

        <a href="${dashboardUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-top:28px;">View full dashboard</a>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] card strength digest email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendTeamInviteEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteToken: string
): Promise<{ ok: boolean; error?: string }> {
  if (!SITE_URL) {
    return { ok: false, error: "NEXT_PUBLIC_SITE_URL is not set" };
  }
  const acceptUrl = `${SITE_URL}/teams/accept?token=${inviteToken}`;

  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: `You've been invited to join ${teamName} on NIL CARD`,
      html: emailLayout(`
        <div style="margin-bottom:24px;">
          ${brandBadge()}
        </div>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Team invitation</h1>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 24px;">
          <strong style="color:#FFFFFF;">${escapeHtml(inviterName)}</strong> has invited you to join <strong style="color:#C6FF3D;">${escapeHtml(teamName)}</strong> on NIL CARD.
        </p>
        <p style="color:#88888A;font-size:15px;line-height:1.6;margin:0 0 32px;">
          Join your team to collaborate on NIL strategies, share analytics, and grow together.
        </p>
        <a href="${acceptUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">
          Accept invitation
        </a>
        <p style="color:#555557;font-size:13px;line-height:1.5;margin:32px 0 0;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      `),
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] team invite email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function sendQuotaWarningEmail(
  email: string,
  firstName: string,
  remaining: number,
  limit: number
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "NIL CARD <onboarding@resend.dev>",
      to: email,
      subject: "Action Required: NIL CARD AI Credits Depleted",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111113;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                  <tr>
                    <td style="padding:40px 32px 32px;">
                      <div style="margin-bottom:24px;">
                        <span style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px;letter-spacing:0.5px;">NIL CARD</span>
                      </div>
                      <h1 style="color:#FFFFFF;font-size:20px;font-weight:700;margin:0 0 16px;line-height:1.3;">Your AI Credits are Depleted</h1>
                      <p style="color:#88888A;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        Hey ${escapeHtml(firstName)}, your weekly briefing email was skipped this week because your AI quota is low or at zero (${remaining}/${limit} remaining).
                      </p>
                      <p style="color:#88888A;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        We require at least 2 credits to run the data analysis and generate your brand insights.
                      </p>
                      <a href="${SITE_URL || "https://nilcard.app"}/dashboard/settings" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
                        Upgrade Plan or Buy Credits
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { ok: true };
  } catch (err) {
    console.error("[resend] quota warning email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send warning email" };
  }
}

