export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      await import("./sentry.server.config");
    } catch {
      // Sentry server config unavailable under Turbopack
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    try {
      await import("./sentry.edge.config");
    } catch {
      // Sentry edge config unavailable under Turbopack
    }
  }
}

// ponytail: Sentry's require-in-the-middle fails under Turbopack.
// Dynamic import so the instrumentation hook doesn't crash the dev server.
let captureRequestError: Awaited<typeof import("@sentry/nextjs")>["captureRequestError"] | (() => void) = () => {};
try {
  ({ captureRequestError } = await import("@sentry/nextjs"));
} catch {
  // Sentry not loadable — noop handler
}
export const onRequestError = captureRequestError;
