export function SupplierListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse rounded-xl h-52 bg-slate-200" />
      ))}
    </div>
  )
}
