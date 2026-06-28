'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/shared/PageHeader'
import { AlertStats } from '@/components/alerts/AlertStats'
import { AlertFilters } from '@/components/alerts/AlertFilters'
import { AlertList } from '@/components/alerts/AlertList'
import { AlertListSkeleton } from '@/components/alerts/AlertListSkeleton'
import * as alertsApi from '@/lib/api/alerts'
import { MOCK_ALERTS } from '@/lib/mockData'
import type { Alert, AlertSeverity, AlertStatus, AlertType, PaginatedResponse } from '@/types'

export default function AlertsPage() {
  const [severity, setSeverity] = useState<AlertSeverity | ''>('')
  const [status, setStatus] = useState<AlertStatus>('OPEN')
  const [type, setType] = useState<AlertType | ''>('')
  const [page, setPage] = useState(1)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Unfiltered query for stats — shows global counts regardless of current filter
  const { data: allData } = useQuery({
    queryKey: ['alerts-all'],
    queryFn: async (): Promise<PaginatedResponse<Alert>> => {
      try {
        return await alertsApi.list({ limit: 100 } as Parameters<typeof alertsApi.list>[0])
      } catch {
        return { data: MOCK_ALERTS, total: MOCK_ALERTS.length, page: 1, limit: 100, hasMore: false }
      }
    },
    staleTime: 30_000,
  })

  // Filtered query for the list
  const { data, isLoading } = useQuery({
    queryKey: ['alerts', severity, status, type, page],
    queryFn: async (): Promise<PaginatedResponse<Alert>> => {
      try {
        return await alertsApi.list({
          severity: severity || undefined,
          status: status || undefined,
          type: type || undefined,
          page,
        })
      } catch {
        let filtered = MOCK_ALERTS
        if (severity) filtered = filtered.filter(a => a.severity === severity)
        if (status)   filtered = filtered.filter(a => a.status === status)
        if (type)     filtered = filtered.filter(a => a.type === type)
        return { data: filtered, total: filtered.length, page: 1, limit: 20, hasMore: false }
      }
    },
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onMutate: (id) => setAcknowledgingId(id),
    onSettled: () => setAcknowledgingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
      void queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
      toast.success('Alert acknowledged')
    },
    onError: () => toast.error('Failed to acknowledge alert'),
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onMutate: (id) => setResolvingId(id),
    onSettled: () => setResolvingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
      void queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
      toast.success('Alert resolved')
    },
    onError: () => toast.error('Failed to resolve alert'),
  })

  const alerts    = data?.data ?? []
  const total     = data?.total ?? 0
  const allAlerts = allData?.data ?? MOCK_ALERTS

  if (isLoading) return <AlertListSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader title="Risk & Alerts" description="Real-time procurement risk monitoring" />
      <AlertStats alerts={allAlerts} total={allAlerts.length} />
      <AlertFilters
        severity={severity}
        onSeverityChange={v => { setSeverity(v); setPage(1) }}
        status={status}
        onStatusChange={v => { setStatus(v); setPage(1) }}
        type={type}
        onTypeChange={v => { setType(v); setPage(1) }}
      />
      <AlertList
        alerts={alerts}
        total={total}
        page={page}
        onPageChange={setPage}
        onAcknowledge={id => acknowledgeMutation.mutate(id)}
        onResolve={id => resolveMutation.mutate(id)}
        acknowledgingId={acknowledgingId}
        resolvingId={resolvingId}
        status={status}
      />
    </div>
  )
}
