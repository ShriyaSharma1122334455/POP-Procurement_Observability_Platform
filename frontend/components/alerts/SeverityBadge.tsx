import type { AlertSeverity } from '@/types'

const config: Record<AlertSeverity, { bg: string; text: string; border: string; dot: string }> = {
  CRITICAL: { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    dot: 'text-red-500' },
  HIGH:     { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'text-orange-500' },
  MEDIUM:   { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'text-yellow-500' },
  LOW:      { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'text-blue-500' },
}

interface SeverityBadgeProps {
  severity: AlertSeverity
  size?: 'sm' | 'md'
}

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const c = config[severity]
  const label = severity.charAt(0) + severity.slice(1).toLowerCase()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${c.bg} ${c.text} ${c.border} ${
        size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <span className={c.dot}>●</span>
      {label}
    </span>
  )
}
