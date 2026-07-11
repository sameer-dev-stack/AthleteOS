"use server";

import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getStorage } from "@/lib/storage";
import { sendConfirmationEmail } from "@/lib/actions/emails";

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email();

export type WaitlistResult = {
  ok: boolean;
  message: string;
  alreadyJoined?: boolean;
};

export type NewsletterResult = {
  ok: boolean;
  message: string;
  alreadyJoined?: boolean;
};

const RATE_WINDOW_SEC = 30;
const RATE_MAX = 3;

async function submit(
  set: "waitlist" | "newsletter",
  rawEmail: FormDataEntryValue | null,
  source: string = "landing"
): Promise<{ ok: boolean; message: string; alreadyJoined?: boolean }> {
  if (typeof rawEmail !== "string") {
    return { ok: false, message: "Please enter your email." };
  }
  const parsed = EmailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return { ok: false, message: "That doesn't look like a valid email." };
  }

    try {
    const storage = await getStorage();
    if (await storage.isRateLimited(parsed.data, RATE_WINDOW_SEC, RATE_MAX)) {
      return { ok: false, message: "Slow down — try again in a moment." };
    }

    if (storage.mode === "supabase" && Math.random() < 0.01) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabase.rpc("cleanup_rate_limits");
      } catch {}
    }

    const token = crypto.randomBytes(32).toString("hex");
    const { added, total, confirmationToken } = await storage.addEmail(
      set,
      parsed.data,
      source,
      token
    );

    if (!added) {
      return {
        ok: true,
        message: "You're already on the list.",
        alreadyJoined: true,
      };
    }

    const storedToken = confirmationToken || token;

    if (set === "waitlist" && storage.mode === "supabase") {
      const emailResult = await sendConfirmationEmail(parsed.data, storedToken);
      if (!emailResult.ok) {
        console.error("[waitlist] confirmation email failed", emailResult.error);
      }
    }

    console.error(
      `[athleteos] ${set} joined (total: ${total}, mode: ${storage.mode}, source: ${source})`
    );

    return { ok: true, message: "You're in. Check your inbox for next steps." };
  } catch (err) {
    console.error("[waitlist] persistence failed", err);
    return {
      ok: false,
      message: "Something went wrong on our end. Please try again.",
    };
  }
}

export async function joinWaitlist(
  _prev: WaitlistResult,
  formData: FormData
): Promise<WaitlistResult> {
  if (formData.get("company")) {
    return { ok: true, message: "You're in. Check your inbox for next steps." };
  }
  const source = (formData.get("source") as string) || "landing";
  const result = await submit("waitlist", formData.get("email"), source);
  if (result.ok) revalidatePath("/");
  return result;
}

export async function joinNewsletter(
  formData: FormData
): Promise<NewsletterResult> {
  if (formData.get("company")) {
    return { ok: true, message: "Subscribed." };
  }
  const result = await submit("newsletter", formData.get("email"));
  if (result.ok) revalidatePath("/");
  return result;
}

export async function subscribeNewsletterAction(
  formData: FormData
): Promise<void> {
  await joinNewsletter(formData);
}
