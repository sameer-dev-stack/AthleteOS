"use client";

// Lazy PostHog singleton. `posthog-js` is heavy (~200 KiB) and is analytics,
// not needed for first paint, so we dynamic-import it only after the app has
// loaded. The exported `posthog` is a proxy that forwards every call to the
// real instance once it has initialized; before that it is a safe no-op, so
// existing `posthog.capture(...)` / `posthog.identify(...)` call sites need no
// changes and never throw.
type PostHog = typeof import("posthog-js").default;

let instance: PostHog | null = null;
let initStarted = false;

export const posthog = new Proxy({} as PostHog, {
  get: (_target, prop) => {
    // Forward any property access as a method call to the real instance.
    return (...args: unknown[]) => {
      const fn = instance?.[prop as keyof PostHog] as
        | ((...a: unknown[]) => unknown)
        | undefined;
      return fn?.(...args);
    };
  },
}) as PostHog;

export async function initPostHog(): Promise<void> {
  if (initStarted || instance) return;
  initStarted = true;

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  try {
    const mod = await import("posthog-js");
    instance = mod.default;

    instance.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      asset_host: "/proxy/posthog",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      persistence: "localStorage+cookie",
      debug: false,
      loaded: () => {
        instance?.capture("$pageview");
      },
    } as unknown as Parameters<PostHog["init"]>[1]);
  } catch (err) {
    console.error("[posthog] init failed:", err);
  }
}
