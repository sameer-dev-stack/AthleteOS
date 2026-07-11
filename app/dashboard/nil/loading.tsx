export default function NilLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="flex justify-center">
        <div className="h-36 w-36 rounded-full bg-white/[0.06]" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="h-4 w-16 rounded bg-white/[0.06]" />
            <div className="h-6 w-12 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="h-5 w-5 rounded bg-white/[0.06]" />
            <div className="h-4 w-32 rounded bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
            <div className="ml-auto h-4 w-16 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="h-4 w-40 rounded bg-white/[0.06]" />
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
