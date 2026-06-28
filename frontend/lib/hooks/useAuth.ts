"use client"

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { authApi, type LoginCredentials, type SignupData } from '@/lib/api/auth'

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore()
  const router = useRouter()

  const handleLogin = useCallback(
    async (credentials: LoginCredentials, redirectTo = '/dashboard') => {
      const { user: u, token: t } = await authApi.login(credentials)
      login(u, t)
      router.push(redirectTo)
    },
    [login, router]
  )

  const handleSignup = useCallback(
    async (data: SignupData) => {
      const { user: u, token: t } = await authApi.signup(data)
      login(u, t)
      router.push('/dashboard')
    },
    [login, router]
  )

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore — always clear local state
    } finally {
      logout()
      router.push('/login')
    }
  }, [logout, router])

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  }
}
