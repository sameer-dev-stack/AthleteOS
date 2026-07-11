export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-white/[0.04]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="h-4 w-16 rounded bg-white/[0.06]" />
            <div className="h-4 flex-1 rounded bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
