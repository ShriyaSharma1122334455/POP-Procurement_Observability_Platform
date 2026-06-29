'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Alert } from '@/types'
import { SeverityBadge } from './SeverityBadge'
import { AlertTypeBadge } from './AlertTypeBadge'

const severityCard: Record<string, string> = {
  CRITICAL: 'bg-red-50 border-red-200',
  HIGH:     'bg-orange-50 border-orange-200',
  MEDIUM:   'bg-yellow-50 border-yellow-200',
  LOW:      'bg-white border-slate-200',
}

const severityHover: Record<string, string> = {
  CRITICAL: 'hover:border-red-300 hover:shadow-sm',
  HIGH:     'hover:border-orange-300 hover:shadow-sm',
  MEDIUM:   'hover:border-yellow-300 hover:shadow-sm',
  LOW:      'hover:border-slate-300 hover:shadow-sm',
}

interface AlertCardProps {
  alert: Alert
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
  isAcknowledging: boolean
  isResolving: boolean
}

export function AlertCard({ alert, onAcknowledge, onResolve, isAcknowledging, isResolving }: AlertCardProps) {
  const router = useRouter()
  const cardBg = severityCard[alert.severity] ?? 'bg-white border-slate-200'
  const cardHover = severityHover[alert.severity] ?? 'hover:border-slate-300 hover:shadow-sm'
  const firstSentence = alert.recommendation?.split('. ')[0]

  const handleCardClick = () => router.push(`/alerts/${alert.id}`)

  return (
    <div
      role="article"
      onClick={handleCardClick}
      className={`cursor-pointer rounded-xl border p-5 transition-all duration-150 motion-reduce:transition-none ${cardBg} ${cardHover}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTypeBadge type={alert.type} />
          <SeverityBadge severity={alert.severity} />
        </div>
        <span className="whitespace-nowrap text-xs text-slate-500">
          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors duration-100">
        {alert.title}
      </h3>

      {/* Description */}
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{alert.description}</p>

      {/* Estimated impact */}
      {alert.estimatedImpact !== undefined && (
        <p className="mt-2 text-sm font-medium text-red-700">
          ⚠ Estimated impact: ${alert.estimatedImpact.toLocaleString()}/year
        </p>
      )}

      {/* First sentence of recommendation */}
      {firstSentence && (
        <p className="mt-1 text-sm italic text-slate-500">💡 {firstSentence}</p>
      )}

      {/* Action area */}
      <div className="mt-3 flex items-center justify-between">
        {alert.status === 'OPEN' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); onAcknowledge(alert.id) }}
              disabled={isAcknowledging}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {isAcknowledging ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Acknowledge
            </button>
            <button
              onClick={e => { e.stopPropagation(); onResolve(alert.id) }}
              disabled={isResolving}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {isResolving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Resolve
            </button>
          </div>
        ) : (
          <div>
            {alert.status === 'ACKNOWLEDGED' && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
                Acknowledged
              </span>
            )}
            {alert.status === 'RESOLVED' && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                Resolved ✓
              </span>
            )}
          </div>
        )}
        <Link
          href={`/alerts/${alert.id}`}
          onClick={e => e.stopPropagation()}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
        >
          View Details →
        </Link>
      </div>
    </div>
  )
}
