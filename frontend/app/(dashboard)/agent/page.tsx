'use client'
import { useEffect, useState } from 'react'
import { SavingsAgentChat } from '@/components/agent/SavingsAgentChat'
import { AgentHistoryPanel, type AgentHistoryEntry } from '@/components/agent/AgentHistoryPanel'

const HISTORY_KEY = 'pop-agent-history'
const MAX_HISTORY = 10

export default function AgentPage() {
  const [history, setHistory] = useState<AgentHistoryEntry[]>([])
  const [prefill, setPrefill] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw) as AgentHistoryEntry[])
    } catch {}
  }, [])

  const handleQueryComplete = (entry: AgentHistoryEntry) => {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="flex gap-6" style={{ height: 'calc(100vh - 3.5rem - 96px)' }}>
      <div className="flex-1 min-w-0">
        <SavingsAgentChat
          onQueryComplete={handleQueryComplete}
          prefill={prefill}
          onPrefillUsed={() => setPrefill('')}
        />
      </div>
      <div className="w-72 hidden lg:block">
        <AgentHistoryPanel history={history} onSelect={setPrefill} />
      </div>
    </div>
  )
}
