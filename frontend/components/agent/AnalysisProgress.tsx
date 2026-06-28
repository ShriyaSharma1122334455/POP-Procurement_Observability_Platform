'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, Circle } from 'lucide-react'

const STEPS = [
  'Scanning supplier price histories...',
  'Benchmarking against market rates...',
  'Analyzing purchase order patterns...',
  'Identifying volume discount thresholds...',
  'Calculating savings opportunities...',
  'Generating recommendations...',
]

export function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [progressWidth, setProgressWidth] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < STEPS.length - 1) {
          setCompletedSteps(c => {
            const next = new Set(c)
            next.add(prev)
            return next
          })
          return prev + 1
        }
        return prev
      })
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const target = 90
    const duration = STEPS.length * 1400
    const startTime = Date.now()

    const frame = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * target, target)
      setProgressWidth(progress)
      if (progress < target) {
        rafRef.current = requestAnimationFrame(frame)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">⚡</span>
        <span className="text-sm font-medium text-slate-700">Analyzing your procurement data...</span>
      </div>

      <div className="space-y-1.5">
        {STEPS.map((step, i) => {
          const done   = completedSteps.has(i)
          const active = i === currentStep && !done
          return (
            <div key={i} className="flex items-center gap-2">
              {done ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-300" />
              )}
              <span
                className={`text-sm ${
                  done   ? 'text-slate-700' :
                  active ? 'animate-pulse font-medium text-blue-600' :
                           'text-slate-400'
                }`}
              >
                {done ? step.replace('...', '') : step}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3">
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">{Math.round(progressWidth)}%</p>
      </div>
    </div>
  )
}
