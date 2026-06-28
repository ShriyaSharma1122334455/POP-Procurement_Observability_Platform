import { DollarSign, TrendingDown, Building2, Bell } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency } from '@/lib/utils'
import type { SpendSummary } from '@/types'

interface SpendOverviewProps {
  summary: SpendSummary
}

export function SpendOverview({ summary }: SpendOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Spend"
        value={formatCurrency(summary.totalSpend)}
        change={summary.changePercent}
        icon={DollarSign}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        title="Savings Found"
        value={formatCurrency(summary.savingsIdentified, true)}
        icon={TrendingDown}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
      />
      <StatCard
        title="Active Suppliers"
        value={summary.activeSuppliers.toString()}
        icon={Building2}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      <StatCard
        title="Open Alerts"
        value={summary.openAlerts.toString()}
        icon={Bell}
        iconBgColor="bg-red-100"
        iconColor="text-red-500"
        invertChange
      />
    </div>
  )
}
