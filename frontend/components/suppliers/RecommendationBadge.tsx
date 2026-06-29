import { CheckCircle2, MessageSquare, GitBranch, AlertOctagon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupplierRecommendation } from '@/types'

interface RecommendationBadgeProps {
  recommendation: SupplierRecommendation
  size?: 'sm' | 'md'
}

interface BadgeConfig {
  label: string
  classes: string
  Icon: LucideIcon
}

const CONFIG: Record<SupplierRecommendation, BadgeConfig> = {
  RENEW:     { label: 'Renew',     classes: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  NEGOTIATE: { label: 'Negotiate', classes: 'bg-blue-100 text-blue-700 border-blue-200',         Icon: MessageSquare },
  DIVERSIFY: { label: 'Diversify', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200',   Icon: GitBranch },
  REPLACE:   { label: 'Replace',   classes: 'bg-red-100 text-red-700 border-red-200',            Icon: AlertOctagon },
}

export function RecommendationBadge({ recommendation, size = 'sm' }: RecommendationBadgeProps) {
  const cfg = CONFIG[recommendation]
  const { label, classes, Icon } = cfg
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        classes,
      )}
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden />
      {label}
    </span>
  )
}
