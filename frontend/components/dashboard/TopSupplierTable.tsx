'use client'

import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, cn } from '@/lib/utils'
import type { SpendSummary } from '@/types'

interface TopSupplierTableProps {
  suppliers: SpendSummary['topSuppliers']
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

function getRiskColor(score: number): string {
  if (score < 40) return 'bg-emerald-500'
  if (score <= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

export function TopSupplierTable({ suppliers }: TopSupplierTableProps) {
  const router = useRouter()
  const top5 = suppliers.slice(0, 5)

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Top Suppliers by Spend</h2>
      </div>

      {top5.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No supplier data"
          description="Top suppliers will appear here once spend records are linked."
          className="py-12"
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {top5.map(({ supplier, totalSpend, percentage }) => (
            <div
              key={supplier.id}
              role="button"
              tabIndex={0}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors duration-100"
              onClick={() => router.push(`/suppliers/${supplier.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(`/suppliers/${supplier.id}`)
                }
              }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 select-none">
                  {getInitials(supplier.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate leading-tight">
                    {supplier.name}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 mt-0.5">
                    {supplier.category}
                  </span>
                </div>
              </div>

              {/* Risk dot */}
              <div
                className="shrink-0"
                title={`Risk: ${supplier.riskScore}`}
                aria-label={`Risk score ${supplier.riskScore}`}
              >
                <span className={cn('block size-2.5 rounded-full', getRiskColor(supplier.riskScore))} />
              </div>

              {/* Spend */}
              <span className="shrink-0 text-sm font-medium text-slate-900 tabular-nums w-20 text-right">
                {formatCurrency(totalSpend)}
              </span>

              {/* Progress bar + % */}
              <div className="shrink-0 flex items-center gap-2 w-28">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 tabular-nums w-8 text-right shrink-0">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
