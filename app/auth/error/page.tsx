import Link from "next/link";
import { Logo } from "@/components/logo";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message: rawMessage } = await searchParams;
  const message =
    rawMessage ?? "Something went wrong during sign-in.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5"
            aria-label="AthleteOS home"
          >
            <Logo />
            <span className="text-lg font-semibold tracking-tight">
              AthleteOS
            </span>
          </Link>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h1 className="text-xl font-bold text-white">Sign-in failed</h1>
          <p className="mt-3 text-sm text-ink-muted">{message}</p>
          <Link
            href="/auth/sign-in"
            className="mt-6 inline-block rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
