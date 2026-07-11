"use client";

export default function DashboardAnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <span className="text-2xl font-bold text-red-400">!</span>
        </div>
        <h1 className="text-xl font-bold text-white">Analytics error</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Unable to load analytics data.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
