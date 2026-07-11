export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="mt-2 h-4 w-32 rounded bg-white/[0.04]" />
      </div>
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-white/[0.04]" />
            <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-white/[0.04]" />
            <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-20 rounded bg-white/[0.04]" />
            <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="h-24 w-24 rounded-full bg-white/[0.06]" />
          <div className="h-4 w-20 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
