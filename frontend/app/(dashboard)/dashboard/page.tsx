'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'

import { getSummary, getTrends, type Period } from '@/lib/api/spend'
import { MOCK_SPEND_SUMMARY, generateDailyTrends } from '@/lib/mockData'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { SpendDashboardSkeleton } from '@/components/dashboard/SpendDashboardSkeleton'
import { SpendOverview } from '@/components/dashboard/SpendOverview'
import { SpendChart } from '@/components/dashboard/SpendChart'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { TopSupplierTable } from '@/components/dashboard/TopSupplierTable'

function getMockTrends(p: Period) {
  switch (p) {
    case '7d': return generateDailyTrends(7)
    case '30d': return generateDailyTrends(30)
    case '90d': return generateDailyTrends(90)
  }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const {
    data: summary,
    isPending: summaryPending,
    isError: summaryError,
  } = useQuery({
    queryKey: ['spend-summary', period],
    queryFn: async () => {
      try {
        return await getSummary(period)
      } catch {
        return MOCK_SPEND_SUMMARY
      }
    },
  })

  const { data: trends, isPending: trendsPending } = useQuery({
    queryKey: ['spend-trends', period],
    queryFn: async () => {
      try {
        return await getTrends(period)
      } catch {
        return getMockTrends(period)
      }
    },
  })

  if (summaryPending || trendsPending) {
    return <SpendDashboardSkeleton />
  }

  if (summaryError || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <p className="text-base font-semibold text-slate-900">Failed to load dashboard</p>
        <p className="text-sm text-slate-500 max-w-xs">
          Check your connection and try refreshing the page.
        </p>
      </div>
    )
  }

  const chartTrends = trends ?? getMockTrends(period)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spend Dashboard"
        description="Real-time procurement observability"
        action={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <SpendOverview summary={summary} />
      <SpendChart trends={chartTrends} period={period} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown categories={summary.categoryBreakdown} />
        <TopSupplierTable suppliers={summary.topSuppliers} />
      </div>
    </div>
  )
}
