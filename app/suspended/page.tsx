export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] px-4">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#111113] p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Account Suspended</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Your account has been suspended. Please contact support.
        </p>
        <a
          href="/auth/sign-in"
          className="mt-6 inline-block rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-white/[0.1]"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}
