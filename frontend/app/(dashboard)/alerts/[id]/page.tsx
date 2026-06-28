'use client'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as alertsApi from '@/lib/api/alerts'
import { MOCK_ALERTS } from '@/lib/mockData'
import { AlertDetail } from '@/components/alerts/AlertDetail'
import { AlertListSkeleton } from '@/components/alerts/AlertListSkeleton'

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: alert, isLoading } = useQuery({
    queryKey: ['alert', id],
    queryFn: async () => {
      try {
        return await alertsApi.getById(id)
      } catch {
        return MOCK_ALERTS.find(a => a.id === id) ?? null
      }
    },
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => alertsApi.acknowledge(alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
      void queryClient.invalidateQueries({ queryKey: ['alert', id] })
      toast.success('Alert acknowledged')
    },
    onError: () => toast.error('Failed to acknowledge alert'),
  })

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => alertsApi.resolve(alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
      void queryClient.invalidateQueries({ queryKey: ['alert', id] })
      toast.success('Alert resolved')
    },
    onError: () => toast.error('Failed to resolve alert'),
  })

  if (isLoading) return <AlertListSkeleton />
  if (!alert) return <p className="text-slate-500">Alert not found.</p>

  return (
    <AlertDetail
      alert={alert}
      onAcknowledge={alertId => acknowledgeMutation.mutate(alertId)}
      onResolve={alertId => resolveMutation.mutate(alertId)}
    />
  )
}
