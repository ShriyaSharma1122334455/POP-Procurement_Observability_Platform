import { cn } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  label: string
  className?: string
}

const CIRCUMFERENCE = 251.2 // 2π × 40

function getArcColor(score: number): string {
  if (score >= 80) return '#10B981'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

export function ScoreGauge({ score, label, className }: ScoreGaugeProps) {
  const clamped = Math.min(Math.max(score, 0), 100)
  const offset = CIRCUMFERENCE * (1 - clamped / 100)
  const color = getArcColor(clamped)

  return (
    <div className={cn('relative size-24', className)} aria-label={`${label}: ${score}`}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        {/* Track */}
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
        />
        {/* Progress arc — rotated so 0% starts at top */}
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-slate-900 leading-none tabular-nums">{score}</span>
        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>
      </div>
    </div>
  )
}
