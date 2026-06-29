'use client'

import { BarChart2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { SpendTrend } from '@/types'

interface SupplierSpendChartProps {
  data: SpendTrend[]
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

export function SupplierSpendChart({ data }: SupplierSpendChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Spend History (90 Days)</h3>

      {data.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No spend data"
          description="Spend history will appear here once records are available."
          className="py-8"
        />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXTick}
              interval={13}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYTick}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
            <Bar
              dataKey="amount"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
