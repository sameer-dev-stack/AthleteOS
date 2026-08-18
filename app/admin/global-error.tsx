"use client";

export default function AdminGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <span className="text-2xl font-bold text-red-400">!</span>
        </div>
        <h1 className="text-xl font-bold text-white">Admin panel crashed</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {error.message || "An unexpected error occurred in the admin panel."}
        </p>
        {error.digest && (
          <p className="mt-1 text-[10px] font-mono text-neutral-600">
            digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]"
        >
          Reload admin panel
        </button>
      </div>
    </div>
  );
}
