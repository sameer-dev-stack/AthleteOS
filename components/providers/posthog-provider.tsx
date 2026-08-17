"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

// PostHog is initialized lazily (the heavy posthog-js bundle is dynamically
// imported inside initPostHog) and deferred until after first paint. Analytics
// is not needed for rendering, so keeping it out of the initial bundle shrinks
// the landing page's First Load JS.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      void initPostHog();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}

export { posthog } from "@/lib/posthog";
