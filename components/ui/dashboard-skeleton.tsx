import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      <SkeletonCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
          <SkeletonCircle className="h-8 w-8" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className="mt-2 h-5 w-12 rounded" />
              <Skeleton className="mt-1.5 h-2.5 w-20 rounded" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <SkeletonCard className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </SkeletonCard>

        <SkeletonCard className="p-6">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between border-l-2 border-white/[0.06] pl-3 py-3">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-4 w-8 rounded" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard className="p-5">
            <Skeleton className="h-4 w-36 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <SkeletonCircle className="h-9 w-9 flex-shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28 rounded" />
                      <Skeleton className="h-2.5 w-36 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>

          <SkeletonCard className="p-6">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </SkeletonCard>
        </div>

        <div className="space-y-6">
          <SkeletonCard className="p-5">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="mt-4 aspect-[9/14] w-full rounded-2xl" />
          </SkeletonCard>

          <SkeletonCard className="p-6">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="mt-4 h-16 w-full rounded-xl" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
