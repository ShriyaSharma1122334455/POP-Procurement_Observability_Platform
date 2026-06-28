import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn, formatCurrency, formatPercent } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  /** When true, a positive change is shown in red and negative in green (e.g. "Open Alerts") */
  invertChange?: boolean
  loading?: boolean
  isCurrency?: boolean
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-500",
  invertChange = false,
  loading = false,
  isCurrency = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-10 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    )
  }

  const displayValue =
    typeof value === "number" && isCurrency
      ? formatCurrency(value)
      : value

  const isPositive = (change ?? 0) > 0
  const isNegative = (change ?? 0) < 0

  /* Invert semantics: for alerts, more = worse */
  const changeIsGood = invertChange ? isNegative : isPositive
  const changeIsBad = invertChange ? isPositive : isNegative

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg shrink-0",
            iconBgColor
          )}
          aria-hidden
        >
          <Icon className={cn("size-5", iconColor)} />
        </div>
      </div>

      <p className="text-3xl font-bold text-slate-900 tabular-nums">
        {displayValue}
      </p>

      {change !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            changeIsGood && "text-emerald-600",
            changeIsBad && "text-red-500",
            !changeIsGood && !changeIsBad && "text-slate-500"
          )}
          aria-label={`Change: ${formatPercent(change)}`}
        >
          {changeIsGood && <TrendingUp className="size-4 shrink-0" aria-hidden />}
          {changeIsBad && <TrendingDown className="size-4 shrink-0" aria-hidden />}
          <span>{formatPercent(change)}</span>
          <span className="text-slate-400 font-normal">vs last period</span>
        </div>
      )}
    </div>
  )
}
