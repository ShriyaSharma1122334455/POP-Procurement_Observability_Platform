'use client'

import { LayoutGrid } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatCategory, cn } from '@/lib/utils'
import type { CategorySpend } from '@/types'

interface CategoryBreakdownProps {
  categories: CategorySpend[]
}

const COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
] as const

function getColor(index: number): string {
  return COLORS[index % COLORS.length] ?? '#94A3B8'
}

interface PieTooltipEntry {
  value?: number | string
  name?: string
}

interface PieTooltipProps {
  active?: boolean
  payload?: PieTooltipEntry[]
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  if (!entry) return null
  const val = entry.value
  if (typeof val !== 'number') return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-slate-900 mb-0.5">{entry.name}</p>
      <p className="text-blue-600 font-semibold">{formatCurrency(val)}</p>
    </div>
  )
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const sorted = [...categories].sort((a, b) => b.amount - a.amount)

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Category Breakdown</h2>

      {sorted.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No categories"
          description="Category spend data will appear here once records are available."
        />
      ) : (
        <div className="flex items-center gap-4">
          {/* Donut chart */}
          <div className="shrink-0 w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={52}
                  outerRadius={76}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {sorted.map((_, i) => (
                    <Cell key={i} fill={getColor(i)} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category list */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {sorted.map((cat, i) => {
              const isUp = cat.changePercent > 0
              const isDown = cat.changePercent < 0
              return (
                <div key={cat.category} className="flex items-center gap-2 min-w-0">
                  <span
                    className="shrink-0 size-2 rounded-full"
                    style={{ backgroundColor: getColor(i) }}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm text-slate-700">
                    {formatCategory(cat.category)}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-slate-900 tabular-nums">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-xs tabular-nums font-medium w-11 text-right',
                      isUp && 'text-red-500',
                      isDown && 'text-emerald-600',
                      !isUp && !isDown && 'text-slate-400',
                    )}
                  >
                    {isUp ? '↑' : isDown ? '↓' : ''}
                    {Math.abs(cat.changePercent).toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
