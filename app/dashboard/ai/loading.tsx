export default function AiLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
            <div className="h-12 w-12 rounded-full bg-white/[0.06]" />
            <div className="h-5 w-36 rounded bg-white/[0.06]" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-white/[0.04]" />
              <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
