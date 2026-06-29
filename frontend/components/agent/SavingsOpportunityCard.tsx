import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { SavingsOpportunity } from '@/types'

interface SavingsOpportunityCardProps {
  opportunity: SavingsOpportunity
  index: number
}

const confidenceConfig = {
  HIGH:   { bg: 'bg-emerald-100', text: 'text-emerald-700', showCheck: true },
  MEDIUM: { bg: 'bg-yellow-100',  text: 'text-yellow-700',  showCheck: false },
  LOW:    { bg: 'bg-slate-100',   text: 'text-slate-600',   showCheck: false },
}

export function SavingsOpportunityCard({ opportunity, index }: SavingsOpportunityCardProps) {
  const conf = confidenceConfig[opportunity.confidence]

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
    >
      <div className="flex gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          {/* Title + confidence */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{opportunity.title}</p>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${conf.bg} ${conf.text}`}>
              {conf.showCheck && <CheckCircle2 className="h-3 w-3" />}
              {opportunity.confidence}
            </span>
          </div>

          {/* Annual savings */}
          <p className="mt-1 text-xl font-bold text-emerald-600">
            ${opportunity.annualizedSavings.toLocaleString()}/year
          </p>

          {/* Description */}
          <p className="mt-1 text-sm text-slate-600">{opportunity.description}</p>

          {/* Recommended action */}
          <p className="mt-2 border-t border-slate-100 pt-2 text-sm italic text-slate-500">
            {opportunity.recommendedAction}
          </p>

          {/* Category + link */}
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {opportunity.category}
            </span>
            {opportunity.affectedSuppliers && opportunity.affectedSuppliers.length > 0 && (
              <Link
                href={`/suppliers?category=${encodeURIComponent(opportunity.category)}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View Suppliers →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
