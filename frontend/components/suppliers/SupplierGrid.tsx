'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SupplierCard } from './SupplierCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Building2 } from 'lucide-react'
import type { Supplier } from '@/types'

interface SupplierGridProps {
  suppliers: Supplier[]
  sortBy: string
  total: number
  page: number
  onPageChange: (page: number) => void
}

const PAGE_SIZE = 12

function sortSuppliers(suppliers: Supplier[], sortBy: string): Supplier[] {
  const copy = [...suppliers]
  switch (sortBy) {
    case 'risk':
      return copy.sort((a, b) => b.riskScore - a.riskScore)
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    default: // 'reliability' + 'spend' fallback
      return copy.sort((a, b) => b.reliabilityScore - a.reliabilityScore)
  }
}

export function SupplierGrid({ suppliers, sortBy, total, page, onPageChange }: SupplierGridProps) {
  const sorted = sortSuppliers(suppliers, sortBy)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const isFirst = page === 1
  const isLast = page * PAGE_SIZE >= total

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No suppliers found"
        description="Try adjusting your filters to find matching suppliers."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Showing {from}–{to} of {total} suppliers
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={isFirst}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={isLast}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
