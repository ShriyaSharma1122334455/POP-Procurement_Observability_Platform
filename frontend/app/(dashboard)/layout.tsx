"use client"

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  // Lazy initialiser: false on the server (where persist is undefined),
  // true on the client if Zustand has already rehydrated from localStorage.
  const [isHydrated, setIsHydrated] = useState(
    () => typeof window !== 'undefined' && useAuthStore.persist.hasHydrated()
  )

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
      return
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isHydrated, isAuthenticated, router])

  // Show spinner while hydrating or while redirecting unauthenticated users
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
