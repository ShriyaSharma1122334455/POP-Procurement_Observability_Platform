'use client'

import type { Period } from '@/lib/api/spend'

interface PeriodSelectorProps {
  value: Period
  onChange: (value: Period) => void
}

const OPTIONS: { label: string; value: Period }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shrink-0">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            value === option.value
              ? 'rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors duration-150'
              : 'rounded-full px-3 py-1 text-sm text-slate-500 transition-colors duration-150 hover:text-slate-700 cursor-pointer'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
