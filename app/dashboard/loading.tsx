export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse-soft" />
          <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
        </div>
        <div className="h-9 w-20 rounded-lg bg-white/[0.06] animate-pulse-soft" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 space-y-3">
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-6 w-40 rounded bg-white/[0.04]" />
            <div className="h-3 w-full rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
