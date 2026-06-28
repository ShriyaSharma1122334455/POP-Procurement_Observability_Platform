import { TrendingUp, AlertOctagon, Calendar, PieChart, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AlertType } from '@/types'

const typeConfig: Record<AlertType, { Icon: LucideIcon; label: string }> = {
  PRICE_SPIKE:         { Icon: TrendingUp,   label: 'Price Spike' },
  SUPPLIER_RISK:       { Icon: AlertOctagon, label: 'Supplier Risk' },
  CONTRACT_EXPIRATION: { Icon: Calendar,     label: 'Contract Expiry' },
  SPEND_CONCENTRATION: { Icon: PieChart,     label: 'Spend Concentration' },
  MARKET_ANOMALY:      { Icon: Activity,     label: 'Market Anomaly' },
}

export function AlertTypeBadge({ type }: { type: AlertType }) {
  const { Icon, label } = typeConfig[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
