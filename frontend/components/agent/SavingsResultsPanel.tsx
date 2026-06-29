'use client'
import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import CountUp from 'react-countup'
import type { AgentResponse } from '@/types'
import { SavingsOpportunityCard } from './SavingsOpportunityCard'

interface SavingsResultsPanelProps {
  response: AgentResponse
}

export function SavingsResultsPanel({ response }: SavingsResultsPanelProps) {
  const [showSteps, setShowSteps] = useState(false)

  return (
    <div>
      {/* Total savings */}
      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-2xl font-bold text-emerald-700">
              <CountUp
                start={0}
                end={response.totalPotentialSavings}
                duration={1.5}
                prefix="$"
                separator=","
              />
            </p>
            <p className="text-sm text-emerald-600">potential annual savings</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
            {response.processingTime}s
          </span>
        </div>
      </div>

      {/* Opportunity cards */}
      <div className="space-y-3">
        {response.opportunities.map((opp, i) => (
          <SavingsOpportunityCard key={opp.id} opportunity={opp} index={i} />
        ))}
      </div>

      {/* Analysis steps (collapsible) */}
      <div className="mt-4">
        <button
          onClick={() => setShowSteps(p => !p)}
          className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
        >
          {showSteps ? 'Hide analysis steps ▴' : 'Show analysis steps ▾'}
        </button>
        {showSteps && (
          <ol className="mt-2 list-decimal list-inside space-y-1">
            {response.analysisSteps.map((step, i) => (
              <li key={i} className="text-sm text-slate-600">{step}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
