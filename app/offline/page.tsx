"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
        <svg
          className="h-8 w-8 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-ink">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-ink-muted">
        Check your internet connection and try again. Some features may be
        unavailable while offline.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Retry
      </button>
    </main>
  );
}
