'use client'
import type { AlertSeverity, AlertStatus, AlertType } from '@/types'

const severities: Array<{ label: string; value: AlertSeverity | '' }> = [
  { label: 'All',      value: '' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High',     value: 'HIGH' },
  { label: 'Medium',   value: 'MEDIUM' },
  { label: 'Low',      value: 'LOW' },
]

const statuses: Array<{ label: string; value: AlertStatus }> = [
  { label: 'Open',         value: 'OPEN' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Resolved',     value: 'RESOLVED' },
]

const alertTypes: Array<{ label: string; value: AlertType | '' }> = [
  { label: 'All Types',           value: '' },
  { label: 'Price Spike',         value: 'PRICE_SPIKE' },
  { label: 'Supplier Risk',       value: 'SUPPLIER_RISK' },
  { label: 'Contract Expiration', value: 'CONTRACT_EXPIRATION' },
  { label: 'Spend Concentration', value: 'SPEND_CONCENTRATION' },
  { label: 'Market Anomaly',      value: 'MARKET_ANOMALY' },
]

// All active chips use white text on a saturated bg — consistent across severities
const severityActiveClass: Record<string, string> = {
  '':       'bg-slate-800 text-white border-slate-800',
  CRITICAL: 'bg-red-600 text-white border-red-600',
  HIGH:     'bg-orange-500 text-white border-orange-500',
  MEDIUM:   'bg-amber-500 text-white border-amber-500',
  LOW:      'bg-blue-500 text-white border-blue-500',
}

interface AlertFiltersProps {
  severity: AlertSeverity | ''
  onSeverityChange: (v: AlertSeverity | '') => void
  status: AlertStatus
  onStatusChange: (v: AlertStatus) => void
  type: AlertType | ''
  onTypeChange: (v: AlertType | '') => void
}

export function AlertFilters({
  severity,
  onSeverityChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
}: AlertFiltersProps) {
  const hasNonDefault = severity !== '' || type !== ''

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4">
      {/* Severity chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-slate-600">Severity</span>
        {severities.map(s => (
          <button
            key={s.value}
            onClick={() => onSeverityChange(s.value)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              severity === s.value
                ? (severityActiveClass[s.value] ?? 'bg-slate-800 text-white border-slate-800')
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="hidden h-6 w-px bg-slate-200 sm:block" />

      {/* Status pills */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-slate-600">Status</span>
        {statuses.map(s => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              status === s.value
                ? 'bg-slate-800 text-white border-slate-800'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="hidden h-6 w-px bg-slate-200 sm:block" />

      {/* Type dropdown */}
      <select
        value={type}
        onChange={e => onTypeChange(e.target.value as AlertType | '')}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {alertTypes.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {hasNonDefault && (
        <button
          onClick={() => { onSeverityChange(''); onTypeChange('') }}
          className="ml-auto cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
