export default function AdminLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0E0E10]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-20 rounded bg-white/[0.06]" />
        </div>
        <div className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        </div>
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-white/[0.06]" />
              <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">
          <div className="mb-8 h-8 w-32 rounded bg-white/[0.06]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-[#111113] p-6"
              >
                <div className="h-4 w-24 rounded bg-white/[0.06]" />
                <div className="mt-3 h-8 w-16 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
