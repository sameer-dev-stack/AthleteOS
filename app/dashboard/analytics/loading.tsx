export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
            <div className="h-7 w-16 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
      <div className="h-64 w-full rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
      <div className="space-y-3">
        <div className="h-5 w-28 rounded bg-white/[0.06]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="h-4 w-4 rounded bg-white/[0.06]" />
            <div className="h-4 flex-1 rounded bg-white/[0.06]" />
            <div className="h-4 w-12 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
