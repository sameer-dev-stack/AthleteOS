"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

function initPostHog() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // `asset_host` is the key posthog-js 1.396.6 uses for lazy static assets
    // (surveys.js, dead-clicks-autocapture.js, web-vitals.js). Pointing it at
    // our origin proxy makes those chunks load from /proxy/posthog/*, which our
    // route handler serves with a 1yr immutable Cache-Control instead of the
    // PostHog CDN's 4h TTL. (api_host stays on us.i.posthog.com for ingest.)
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      asset_host: "/proxy/posthog",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage+cookie",
      loaded: () => {
        posthog.capture("$pageview");
      },
    } as Parameters<typeof posthog.init>[1]);
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
