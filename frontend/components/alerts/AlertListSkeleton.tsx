import { Skeleton } from '@/components/ui/skeleton'

export function AlertListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="mt-2 h-7 w-8" />
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="rounded-xl border bg-white p-4">
        <Skeleton className="h-8 w-full max-w-lg" />
      </div>

      {/* Alert card skeletons — no side-stripe, severity communicated via tint when real */}
      <div className="space-y-3">
        {[
          'border-red-200 bg-red-50',
          'border-orange-200 bg-orange-50',
          'border-slate-200 bg-white',
          'border-yellow-200 bg-yellow-50',
        ].map((classes, i) => (
          <div key={i} className={`animate-pulse rounded-xl border p-5 ${classes}`}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
