export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <div className="h-8 w-64 rounded bg-white/[0.06]" />
          <div className="mt-2 h-4 w-96 rounded bg-white/[0.04]" />
        </div>
        <div className="mb-6 flex gap-3">
          <div className="h-10 w-64 rounded-lg bg-white/[0.06]" />
          <div className="h-10 w-32 rounded-lg bg-white/[0.06]" />
          <div className="h-10 w-32 rounded-lg bg-white/[0.06]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
                  <div>
                    <div className="h-4 w-24 rounded bg-white/[0.06]" />
                    <div className="mt-1 h-3 w-16 rounded bg-white/[0.04]" />
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
              </div>
              <div className="mt-3 flex gap-2">
                <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
                <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
