'use client'
import { History, Inbox } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface AgentHistoryEntry {
  id: string
  prompt: string
  totalSavings: number
  timestamp: string
}

interface AgentHistoryPanelProps {
  history: AgentHistoryEntry[]
  onSelect: (prompt: string) => void
}

export function AgentHistoryPanel({ history, onSelect }: AgentHistoryPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <History className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Recent Queries</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">No queries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(entry => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.prompt)}
                className="w-full cursor-pointer rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
              >
                <p className="line-clamp-1 text-sm font-medium text-slate-800">{entry.prompt}</p>
                <p className="text-xs text-emerald-600">${entry.totalSavings.toLocaleString()} savings</p>
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
