'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn, getScoreColor } from '@/lib/utils'
import { RecommendationBadge } from './RecommendationBadge'
import type { Supplier } from '@/types'

interface SupplierCardProps {
  supplier: Supplier
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

const SCORES = [
  { key: 'reliabilityScore',    label: 'RELIABILITY' },
  { key: 'competitivenessScore', label: 'COMPETITIVE' },
  { key: 'riskScore',           label: 'RISK' },
  { key: 'relationshipScore',   label: 'RELATION' },
] as const

export function SupplierCard({ supplier }: SupplierCardProps) {
  const router = useRouter()

  let updatedLabel = 'recently'
  try {
    updatedLabel = formatDistanceToNow(parseISO(supplier.updatedAt), { addSuffix: true })
  } catch {
    // keep default
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 cursor-pointer flex flex-col gap-4"
      onClick={() => router.push(`/suppliers/${supplier.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/suppliers/${supplier.id}`)
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700 select-none">
            {getInitials(supplier.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {supplier.name}
            </p>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 mt-0.5">
              {supplier.category}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <RecommendationBadge recommendation={supplier.recommendation} size="sm" />
        </div>
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-4 gap-2">
        {SCORES.map(({ key, label }) => {
          const value = supplier[key]
          return (
            <div key={key} className="flex flex-col gap-1">
              <span className={cn('text-2xl font-bold leading-none tabular-nums', getScoreColor(value))}>
                {value}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide leading-none">
                {label}
              </span>
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div
                  className={cn('h-full rounded-full', getBarColor(value))}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-xs text-slate-400">Updated {updatedLabel}</span>
        <ChevronRight className="size-4 text-slate-300" aria-hidden />
      </div>
    </div>
  )
}
