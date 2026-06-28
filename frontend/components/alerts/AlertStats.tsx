import { Bell, AlertOctagon, AlertTriangle, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Alert } from '@/types'

interface AlertStatsProps {
  alerts: Alert[]
  total: number
}

export function AlertStats({ alerts }: AlertStatsProps) {
  const open     = alerts.filter(a => a.status === 'OPEN').length
  const critical = alerts.filter(a => a.severity === 'CRITICAL').length
  const high     = alerts.filter(a => a.severity === 'HIGH').length
  const resolved = alerts.filter(a => a.status === 'RESOLVED').length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MiniStat icon={Bell}          label="Total Open"    value={open}     colorClass="text-blue-600"    bgClass="bg-blue-50" />
      <MiniStat icon={AlertOctagon}  label="Critical"      value={critical} colorClass="text-red-600"     bgClass="bg-red-50" />
      <MiniStat icon={AlertTriangle} label="High Priority" value={high}     colorClass="text-orange-600"  bgClass="bg-orange-50" />
      <MiniStat icon={CheckCircle}   label="Resolved"      value={resolved} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
}: {
  icon: LucideIcon
  label: string
  value: number
  colorClass: string
  bgClass: string
}) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bgClass}`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}
