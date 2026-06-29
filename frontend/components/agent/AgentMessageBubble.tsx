'use client'
import type { AgentResponse } from '@/types'
import { useAuthStore } from '@/lib/stores/authStore'
import { AnalysisProgress } from './AnalysisProgress'
import { SavingsResultsPanel } from './SavingsResultsPanel'

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: AgentResponse
  timestamp: Date
  isLoading?: boolean
}

export function AgentMessageBubble({ message }: { message: AgentMessage }) {
  const user = useAuthStore(state => state.user)
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  if (message.role === 'user') {
    return (
      <div className="flex items-end justify-end gap-2 animate-fade-in-up" style={{ opacity: 0 }}>
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white">
          {message.content}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
          {initials}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 animate-fade-in-up" style={{ opacity: 0 }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        P
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-slate-200 bg-white p-4">
        {message.isLoading ? (
          <AnalysisProgress />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-700">{message.content}</p>
            {message.response && message.response.opportunities.length > 0 && (
              <SavingsResultsPanel response={message.response} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
