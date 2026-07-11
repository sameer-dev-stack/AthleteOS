export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-40 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="h-9 w-9 rounded-lg bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-48 rounded bg-white/[0.04]" />
            </div>
            <div className="h-5 w-9 rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
