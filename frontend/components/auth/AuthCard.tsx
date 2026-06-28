import Link from 'next/link'
import { Diamond } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthCardProps {
  children: ReactNode
  bottomLink: {
    text: string
    href: string
    linkText: string
  }
}

export function AuthCard({ children, bottomLink }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo lockup */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 shrink-0">
            <Diamond className="size-4 text-white fill-white" aria-hidden />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">POP</p>
            <p className="text-xs text-blue-300 leading-tight">
              Procurement Observability Platform
            </p>
          </div>
        </div>

        {/* Card — shadow only, no border (impeccable: pick one) */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}

          {/* Bottom link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {bottomLink.text}{' '}
            <Link
              href={bottomLink.href}
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {bottomLink.linkText} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
