'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'

interface AgentInputProps {
  onSubmit: (prompt: string) => void
  isLoading: boolean
  disabled?: boolean
  prefill?: string
  onPrefillUsed?: () => void
}

export function AgentInput({ onSubmit, isLoading, disabled = false, prefill, onPrefillUsed }: AgentInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Apply prefill from history panel — useEffect avoids setting state during render
  useEffect(() => {
    if (!prefill) return
    setValue(prefill)
    onPrefillUsed?.()
  }, [prefill]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync textarea height whenever value changes
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading || disabled) return
    onSubmit(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const MAX_CHARS = 500

  return (
    <div className="relative border-t border-slate-200 bg-white p-3">
      {value.length > 400 && (
        <p className="mb-1 text-right text-xs text-slate-400">
          {value.length} / {MAX_CHARS}
        </p>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about savings, suppliers, or cost reduction..."
          disabled={disabled}
          className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading || disabled}
          aria-label="Send message"
          className="absolute bottom-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ArrowUp className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  )
}
