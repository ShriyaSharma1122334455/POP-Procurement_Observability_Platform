'use client'

const FOLLOW_UP_PROMPTS = [
  'Which other categories have savings potential?',
  'Find me the lowest-risk supplier switch available',
]

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
  visible: boolean
}

export function SuggestedPrompts({ onSelect, visible }: SuggestedPromptsProps) {
  if (!visible) return null
  return (
    <div
      className="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-2 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {FOLLOW_UP_PROMPTS.map(prompt => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-all hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
