'use client'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, CheckCircle, Download } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Alert } from '@/types'
import { SeverityBadge } from './SeverityBadge'
import { AlertTypeBadge } from './AlertTypeBadge'

interface AlertDetailProps {
  alert: Alert
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const statusPill: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:         { bg: 'bg-blue-100',    text: 'text-blue-800',    label: 'Open' },
  ACKNOWLEDGED: { bg: 'bg-yellow-100',  text: 'text-yellow-800',  label: 'Acknowledged' },
  RESOLVED:     { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Resolved' },
}

const btnBase = 'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed'

export function AlertDetail({ alert, onAcknowledge, onResolve }: AlertDetailProps) {
  const recommendations = alert.recommendation
    ? alert.recommendation.split('. ').filter(Boolean)
    : []

  const pill = statusPill[alert.status]

  return (
    <div className="space-y-6">
      <Link
        href="/alerts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Alerts
      </Link>

      {/* Section A — Header */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity} size="md" />
          <AlertTypeBadge type={alert.type} />
          {pill && (
            <span className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${pill.bg} ${pill.text}`}>
              {pill.label}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-snug text-slate-900">{alert.title}</h1>
      </div>

      {/* Section B — Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Type',      value: toTitleCase(alert.type) },
          { label: 'Severity',  value: toTitleCase(alert.severity) },
          { label: 'Status',    value: toTitleCase(alert.status) },
          { label: 'Triggered', value: format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm') },
        ].map(item => (
          <div key={item.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Section C — Description */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">What Happened</h2>
        <p className="text-sm leading-relaxed text-slate-600 max-w-prose">{alert.description}</p>
      </div>

      {/* Section D — Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recommended Actions</h2>
          <ol className="list-decimal list-inside space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-slate-700">{rec}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Section E — Affected Supplier */}
      {alert.supplier && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Affected Supplier</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {alert.supplier.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{alert.supplier.name}</p>
              <p className="text-xs text-slate-500">{alert.supplier.category}</p>
            </div>
            <Link
              href={`/suppliers/${alert.supplierId}`}
              className="ml-auto text-sm font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              View Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Section F — Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onAcknowledge(alert.id)}
          disabled={alert.status !== 'OPEN'}
          className={`${btnBase} border border-yellow-300 bg-white text-yellow-800 hover:bg-yellow-50 focus-visible:ring-yellow-400`}
        >
          <ShieldAlert className="h-4 w-4" />
          Acknowledge Alert
        </button>
        <button
          onClick={() => onResolve(alert.id)}
          disabled={alert.status === 'RESOLVED'}
          className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500`}
        >
          <CheckCircle className="h-4 w-4" />
          Mark as Resolved
        </button>
        <button
          onClick={() => toast('Export coming in Phase 2')}
          className={`${btnBase} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400`}
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>
    </div>
  )
}
