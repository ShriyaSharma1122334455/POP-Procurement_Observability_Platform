"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login(user, token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("pop_token", token)
          document.cookie = `pop_token=${token}; path=/; max-age=86400; SameSite=Lax`
        }
        set({ user, token, isAuthenticated: true })
      },

      logout() {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pop_token")
          document.cookie = 'pop_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser(user) {
        set({ user })
      },
    }),
    {
      name: "pop-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
