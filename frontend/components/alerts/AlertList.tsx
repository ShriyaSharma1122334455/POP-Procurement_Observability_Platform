import { CheckCircle2 } from 'lucide-react'
import type { Alert, AlertStatus } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCard } from './AlertCard'

const PAGE_SIZE = 10

interface AlertListProps {
  alerts: Alert[]
  total: number
  page: number
  onPageChange: (page: number) => void
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
  /** ID of the alert currently being acknowledged, null if none */
  acknowledgingId: string | null
  /** ID of the alert currently being resolved, null if none */
  resolvingId: string | null
  status: AlertStatus
}

export function AlertList({
  alerts,
  total,
  page,
  onPageChange,
  onAcknowledge,
  onResolve,
  acknowledgingId,
  resolvingId,
  status,
}: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No alerts"
        description={
          status === 'OPEN'
            ? "You're all clear — no open alerts."
            : 'No alerts match the current filters.'
        }
      />
    )
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
          onResolve={onResolve}
          isAcknowledging={acknowledgingId === alert.id}
          isResolving={resolvingId === alert.id}
        />
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
