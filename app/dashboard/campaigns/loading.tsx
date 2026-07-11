export default function CampaignsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-64 rounded bg-white/[0.04]" />
      </div>
      <div className="max-w-5xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 rounded bg-white/[0.06]" />
              <div className="h-6 w-16 rounded bg-white/[0.06]" />
            </div>
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
