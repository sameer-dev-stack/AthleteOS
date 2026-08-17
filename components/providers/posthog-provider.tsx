"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

function initPostHog() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    // Serve PostHog's lazy static assets (surveys, dead-clicks, web-vitals,
    // config) through our own origin proxy so we control their cache lifetime
    // instead of the PostHog CDN's 4h/5m TTLs. See next.config.mjs rewrite.
    ui_host: "/proxy/posthog",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage+cookie",
      loaded: () => {
        posthog.capture("$pageview");
      },
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(initPostHog, 2000);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}

export { posthog };
