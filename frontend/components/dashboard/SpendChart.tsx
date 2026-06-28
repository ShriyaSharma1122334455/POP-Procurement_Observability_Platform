'use client'

import { BarChart2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { SpendTrend } from '@/types'
import type { Period } from '@/lib/api/spend'

interface SpendChartProps {
  trends: SpendTrend[]
  period: Period
}

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
}

const TICK_INTERVALS: Record<Period, number> = {
  '7d': 0,
  '30d': 4,
  '90d': 13,
}

function formatXTick(value: string | number): string {
  const str = String(value)
  try {
    return format(parseISO(str), 'MMM d')
  } catch {
    return str
  }
}

function formatYTick(value: number | string): string {
  return formatCurrency(Number(value), true)
}

interface TooltipEntry {
  value?: number | string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  if (!entry) return null
  const rawValue = entry.value
  if (typeof rawValue !== 'number') return null

  const rawLabel = typeof label === 'string' ? label : String(label ?? '')
  let formattedDate = rawLabel
  try {
    formattedDate = format(parseISO(rawLabel), 'MMM d, yyyy')
  } catch {
    // keep raw
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-500 mb-0.5">{formattedDate}</p>
      <p className="text-sm font-semibold text-blue-600">{formatCurrency(rawValue)}</p>
    </div>
  )
}

export function SpendChart({ trends, period }: SpendChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-slate-900">Spend Trend</h2>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {PERIOD_LABELS[period]}
        </span>
      </div>

      {trends.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No trend data"
          description="Spend trend data will appear here once procurement records are available."
        />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXTick}
              interval={TICK_INTERVALS[period]}
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYTick}
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#spendGradient)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
