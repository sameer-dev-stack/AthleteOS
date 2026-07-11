"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type TierResult = {
  ok: boolean;
  data?: Record<string, unknown>[];
  error?: string;
};

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CreateTierSchema = z.object({
  athleteId: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(100).max(100000),
});

export async function createTier(
  athleteId: string,
  name: string,
  description: string | undefined,
  priceCents: number
): Promise<TierResult> {
  try {
    const parsed = CreateTierSchema.safeParse({ athleteId, name, description, priceCents });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };
    if (athleteId !== user.id) return { ok: false, error: "Not authorized" };

    const { data, error } = await supabase
      .from("membership_tiers")
      .insert({
        athlete_id: athleteId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price_cents: parsed.data.priceCents,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true, data: [data] };
  } catch (err) {
    console.error("[memberships] createTier error:", err);
    return { ok: false, error: "Failed to create tier" };
  }
}

export async function getTiers(athleteId: string): Promise<TierResult> {
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("is_active", true)
      .order("price_cents", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (err) {
    console.error("[memberships] getTiers error:", err);
    return { ok: false, error: "Failed to load tiers" };
  }
}

export async function deleteTier(tierId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("membership_tiers")
      .update({ is_active: false })
      .eq("id", tierId)
      .eq("athlete_id", user.id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[memberships] deleteTier error:", err);
    return { ok: false, error: "Failed to delete tier" };
  }
}

export async function getSubscribers(athleteId: string): Promise<TierResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };
    if (athleteId !== user.id) return { ok: false, error: "Not authorized" };

    const serviceSupabase = getServiceClient();

    const { data, error } = await serviceSupabase
      .from("fan_subscriptions")
      .select("*, membership_tiers(name, price_cents)")
      .eq("athlete_id", athleteId)
      .eq("status", "active");

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (err) {
    console.error("[memberships] getSubscribers error:", err);
    return { ok: false, error: "Failed to load subscribers" };
  }
}

export async function getSubscriberCount(athleteId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || athleteId !== user.id) return 0;

    const serviceSupabase = getServiceClient();
    const { count } = await serviceSupabase
      .from("fan_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athleteId)
      .eq("status", "active");
    return count ?? 0;
  } catch (err) {
    console.error("[memberships] getSubscriberCount error:", err);
    return 0;
  }
}

const CreatePostSchema = z.object({
  athleteId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().max(5000).optional(),
  isMembersOnly: z.boolean(),
  tierRequired: z.string().max(50),
});

export async function createContentPost(
  athleteId: string,
  title: string,
  body: string | undefined,
  isMembersOnly: boolean,
  tierRequired: string
): Promise<TierResult> {
  try {
    const parsed = CreatePostSchema.safeParse({ athleteId, title, body, isMembersOnly, tierRequired });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };
    if (athleteId !== user.id) return { ok: false, error: "Not authorized" };

    const { data, error } = await supabase
      .from("content_posts")
      .insert({
        athlete_id: athleteId,
        title: parsed.data.title,
        body: parsed.data.body ?? null,
        is_members_only: parsed.data.isMembersOnly,
        tier_required: parsed.data.tierRequired,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true, data: [data] };
  } catch (err) {
    console.error("[memberships] createContentPost error:", err);
    return { ok: false, error: "Failed to create post" };
  }
}

export async function getContentPosts(
  athleteId: string,
  page = 1,
  pageSize = 20
): Promise<{ ok: boolean; data?: Record<string, unknown>[]; total?: number; error?: string }> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };
    if (athleteId !== user.id) return { ok: false, error: "Not authorized" };

    const supabase = getServiceClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("content_posts")
      .select("*", { count: "exact" })
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [], total: count ?? 0 };
  } catch (err) {
    console.error("[memberships] getContentPosts error:", err);
    return { ok: false, error: "Failed to load posts" };
  }
}

export async function publishPost(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    // Atomic toggle: read current state and flip in one operation
    const { data: post, error: readErr } = await supabase
      .from("content_posts")
      .select("published, athlete_id")
      .eq("id", postId)
      .single();

    if (!post || post.athlete_id !== user.id) return { ok: false, error: "Not authorized" };

    // Use conditional update to prevent race condition
    const { error } = await supabase
      .from("content_posts")
      .update({ published: !post.published })
      .eq("id", postId)
      .eq("published", post.published);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[memberships] publishPost error:", err);
    return { ok: false, error: "Failed to publish post" };
  }
}

export async function createSubscriptionCheckout(tierId: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const { data: tier, error: tierError } = await getServiceClient()
      .from("membership_tiers")
      .select("*, profiles!inner(id, email)")
      .eq("id", tierId)
      .eq("is_active", true)
      .single();

    if (tierError || !tier) return { ok: false, error: "Tier not found" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    if (tier.stripe_price_id) {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: tier.stripe_price_id, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/fan/subscribe/${tierId}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/fan/subscribe/${tierId}`,
        metadata: {
          athleteos_user_id: user.id,
          athleteos_athlete_id: tier.athlete_id,
          tier_id: tierId,
        },
      });

      return { ok: true, url: session.url ?? undefined };
    }

    return { ok: false, error: "Stripe price not configured for this tier" };
  } catch (err) {
    console.error("[memberships] createSubscriptionCheckout error:", err);
    return { ok: false, error: "Failed to create checkout session" };
  }
}
