'use client'
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { agentApi } from '@/lib/api/agent'
import type { AgentHistoryEntry } from './AgentHistoryPanel'
import { AgentMessageBubble, type AgentMessage } from './AgentMessageBubble'
import { AgentInput } from './AgentInput'
import { SuggestedPrompts } from './SuggestedPrompts'

const WELCOME_PROMPTS = [
  'Reduce my food costs by 5%',
  'Find cheaper protein supplier alternatives',
  'Which contracts should I renegotiate?',
  'Identify bulk purchasing opportunities',
]

interface SavingsAgentChatProps {
  onQueryComplete: (entry: AgentHistoryEntry) => void
  prefill: string
  onPrefillUsed: () => void
}

export function SavingsAgentChat({ onQueryComplete, prefill, onPrefillUsed }: SavingsAgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const mutation = useMutation({
    mutationFn: (prompt: string) => agentApi.query(prompt),
    onMutate: (prompt) => {
      const userMsg: AgentMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      }
      const loadingMsg: AgentMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      }
      setMessages(prev => [...prev, userMsg, loadingMsg])
      setHasStarted(true)
      return { loadingId: loadingMsg.id }
    },
    onSuccess: (data, _prompt, ctx) => {
      const context = ctx as { loadingId: string }
      setMessages(prev =>
        prev.map(m =>
          m.id === context.loadingId
            ? { ...m, isLoading: false, content: data.summary, response: data }
            : m
        )
      )
      onQueryComplete({
        id: Date.now().toString(),
        prompt: data.query,
        totalSavings: data.totalPotentialSavings,
        timestamp: new Date().toISOString(),
      })
    },
    onError: (_err, _prompt, ctx) => {
      const context = ctx as { loadingId: string }
      setMessages(prev =>
        prev.map(m =>
          m.id === context.loadingId
            ? { ...m, isLoading: false, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      )
    },
  })

  const handleSubmit = (prompt: string) => {
    if (!prompt.trim() || mutation.isPending) return
    mutation.mutate(prompt)
  }

  const hasResponded = messages.some(m => m.role === 'assistant' && !m.isLoading)

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
        <Sparkles className="h-5 w-5 text-white" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">POP Savings Agent</p>
          <p className="text-xs text-blue-200">Powered by Gemini</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs text-blue-100">Active</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasStarted ? (
          <WelcomeScreen onPromptSelect={handleSubmit} />
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <AgentMessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Suggested follow-ups */}
      <SuggestedPrompts onSelect={handleSubmit} visible={hasResponded} />

      {/* Input */}
      <AgentInput
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        prefill={prefill}
        onPrefillUsed={onPrefillUsed}
      />
    </div>
  )
}

function WelcomeScreen({ onPromptSelect }: { onPromptSelect: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6">
      <Sparkles className="h-12 w-12 text-blue-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-900">POP Savings Agent</h2>
      <p className="mt-2 text-sm text-slate-500">
        Ask me to find savings opportunities across your procurement
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
        {WELCOME_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => onPromptSelect(prompt)}
            className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-all hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
