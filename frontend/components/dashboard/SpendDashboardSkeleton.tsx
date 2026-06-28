export function SpendDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="animate-pulse h-7 w-48 rounded-lg bg-slate-200" />
          <div className="animate-pulse h-4 w-64 rounded bg-slate-200" />
        </div>
        <div className="animate-pulse h-9 w-44 rounded-full bg-slate-200" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl h-28 bg-slate-200" />
        ))}
      </div>

      {/* Chart */}
      <div className="animate-pulse rounded-xl h-80 bg-slate-200" />

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse rounded-xl h-64 bg-slate-200" />
        <div className="animate-pulse rounded-xl h-64 bg-slate-200" />
      </div>
    </div>
  )
}
