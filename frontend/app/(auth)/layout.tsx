import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Sign in',
    template: '%s | POP',
  },
}

// AuthCard in each page provides the full-page background and card.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
