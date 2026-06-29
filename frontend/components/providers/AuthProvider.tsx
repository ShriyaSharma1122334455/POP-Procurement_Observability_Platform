"use client"

import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { authApi } from '@/lib/api/auth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const setUser = useAuthStore(s => s.setUser)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    if (!isAuthenticated) return

    // Validate token and refresh user data on mount.
    // If the token has expired server-side, clear local auth state.
    authApi
      .me()
      .then(user => setUser(user))
      .catch(() => logout())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once — on mount only

  return <>{children}</>
}
