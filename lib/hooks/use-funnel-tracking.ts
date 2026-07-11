"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type FunnelEvent =
  | "page_view"
  | "waitlist_view"
  | "waitlist_signup"
  | "cta_click"
  | "sign_up_start"
  | "sign_up_complete"
  | "onboarding_start"
  | "onboarding_complete"
  | "onboarding_skip_profile"
  | "profile_publish"
  | "first_tip_received"
  | "first_subscription_received"
  | "upgrade_click"
  | "upgrade_complete"
  | "public_card_share"
  | "inquiry_sent";

export function trackFunnel(event: FunnelEvent, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // PostHog not initialized
  }
}

export function useFunnelTracking() {
  useEffect(() => {
    trackFunnel("page_view", { path: window.location.pathname });
  }, []);
}
