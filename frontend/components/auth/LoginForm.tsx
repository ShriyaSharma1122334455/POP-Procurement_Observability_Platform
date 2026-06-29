"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { AxiosError } from 'axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthStore } from '@/lib/stores/authStore'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const inputBase =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'focus:border-blue-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed'

const inputError =
  'border-red-400 focus:ring-red-500 focus:border-red-400'

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const loginToStore = useAuthStore(s => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const performLogin = useCallback(
    async (data: LoginFormValues) => {
      setApiError(null)
      setIsLoading(true)
      try {
        await login(data)
      } catch (err) {
        if (err instanceof AxiosError) {
          const msg = (err.response?.data as { message?: string })?.message
          setApiError(msg ?? 'Invalid email or password. Please try again.')
        } else {
          setApiError('An unexpected error occurred. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [login]
  )

  const handleDemoLogin = useCallback(() => {
    setValue('email', 'demo@popplatform.com')
    setValue('password', 'demo1234')
    // Bypass the API — write a demo session directly into the auth store
    // so this works without a running backend.
    loginToStore(
      {
        id: 'demo-1',
        name: 'Demo User',
        email: 'demo@popplatform.com',
        role: 'procurement_manager',
        createdAt: new Date().toISOString(),
      },
      'demo-access-token'
    )
    router.push('/dashboard')
  }, [setValue, loginToStore, router])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900" style={{ textWrap: 'balance' }}>
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your POP account</p>
      </div>

      {/* API error banner */}
      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 mb-5"
        >
          <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" aria-hidden />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(performLogin)} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={isLoading}
            className={cn(inputBase, errors.email && inputError)}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading}
              className={cn(inputBase, 'pr-10', errors.password && inputError)}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Divider + demo */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-slate-400">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-medium py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Demo Login
        </button>
      </form>
    </div>
  )
}
