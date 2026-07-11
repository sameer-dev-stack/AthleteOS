export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-16 rounded bg-white/[0.06]" />
          </div>
          <div className="h-7 w-16 rounded-full bg-white/[0.06]" />
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#111113] p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-white/[0.06]" />
            <div className="mx-auto mt-4 h-6 w-40 rounded bg-white/[0.06]" />
            <div className="mx-auto mt-2 h-4 w-56 rounded bg-white/[0.04]" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mx-auto h-5 w-12 rounded bg-white/[0.06]" />
                <div className="mx-auto mt-1 h-3 w-16 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="h-12 rounded-xl bg-white/[0.06]" />
            <div className="h-12 rounded-xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}
