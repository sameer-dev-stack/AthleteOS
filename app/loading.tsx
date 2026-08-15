import { InfinityLoop } from "@/components/loading-ui/infinity";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <InfinityLoop className="h-12 w-16 text-accent" />
        <p className="text-sm text-ink-muted">Loading...</p>
      </div>
    </div>
  );
}
