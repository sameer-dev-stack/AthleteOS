export default function NilLoading() {
  return (
    <div className="space-y-6">
      {/* Header — stacks on mobile, matches page.tsx header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
          <div className="mt-2 h-4 w-64 max-w-full rounded bg-white/[0.04]" />
        </div>
        <div className="h-9 w-44 max-w-full rounded-xl bg-white/[0.06]" />
      </div>

      {/* Metrics strip — 2 cols mobile / 5 cols desktop (matches NilMetricsStrip) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between rounded-xl border border-white/[0.05] bg-white/[0.04] p-4 min-h-[80px]">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="h-6 w-12 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Core valuation — 1 col mobile / 3 cols desktop (matches page.tsx grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Score circle card */}
        <div className="flex flex-col items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 min-h-[300px]">
          <div className="h-4 w-32 self-start rounded bg-white/[0.06]" />
          <div className="my-4 h-36 w-36 rounded-full bg-white/[0.06]" />
          <div className="w-full space-y-2">
            <div className="mx-auto h-6 w-28 rounded-full bg-white/[0.06]" />
            <div className="mx-auto h-3 w-44 max-w-full rounded bg-white/[0.04]" />
          </div>
        </div>

        {/* Column 2: Rate card table */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <div>
            <div className="mb-5 h-4 w-40 rounded bg-white/[0.06]" />
            <div className="space-y-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="h-3 w-12 rounded bg-white/[0.04]" />
                <div className="h-3 w-16 rounded bg-white/[0.06]" />
                <div className="h-3 w-12 rounded bg-white/[0.04]" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-t border-white/[0.04] pt-3">
                  <div className="h-3 w-28 rounded bg-white/[0.06]" />
                  <div className="h-3 w-12 rounded bg-white/[0.04]" />
                  <div className="h-3 w-16 rounded bg-white/[0.06]" />
                  <div className="h-3 w-12 rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 h-3 w-56 max-w-full rounded bg-white/[0.04]" />
        </div>

        {/* Column 3: AI market breakdown */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <div>
            <div className="mb-5 h-4 w-36 rounded bg-white/[0.06]" />
            <div className="space-y-3">
              <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
              <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
              <div className="h-16 rounded-xl bg-white/[0.02]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
              <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.04] pt-4">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Sponsor pitch generator — full width */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
        <div className="mb-4 h-4 w-48 rounded bg-white/[0.06]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>

      {/* NIL score trend — full width */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
        <div className="mb-4 h-4 w-32 rounded bg-white/[0.06]" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-white/[0.06]" />
              <div className="h-3 w-8 rounded bg-white/[0.06]" />
              <div className="h-3 w-16 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}