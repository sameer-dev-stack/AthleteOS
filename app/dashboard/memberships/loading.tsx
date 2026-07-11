export default function MembershipsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-white/[0.06]" />
                <div className="h-3 w-20 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
