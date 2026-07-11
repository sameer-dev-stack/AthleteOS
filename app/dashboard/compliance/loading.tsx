export default function ComplianceLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
            <div className="h-10 w-10 rounded-xl bg-white/[0.06]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-white/[0.06]" />
              <div className="h-3 w-56 rounded bg-white/[0.04]" />
            </div>
            <div className="h-4 w-16 rounded bg-white/[0.06]" />
            <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
