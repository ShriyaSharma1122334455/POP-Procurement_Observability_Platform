"use client"

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { AxiosError } from 'axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['procurement_manager', 'cfo', 'operations_manager']),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

const ROLE_OPTIONS: { value: SignupFormValues['role']; label: string }[] = [
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'cfo', label: 'CFO / Finance Lead' },
  { value: 'operations_manager', label: 'Operations Manager' },
]

const inputBase =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'focus:border-blue-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed'

const inputError = 'border-red-400 focus:ring-red-500 focus:border-red-400'

export function SignupForm() {
  const { signup } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = useCallback(
    async (data: SignupFormValues) => {
      setApiError(null)
      setIsLoading(true)
      try {
        await signup({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        })
      } catch (err) {
        if (err instanceof AxiosError) {
          const msg = (err.response?.data as { message?: string })?.message
          setApiError(msg ?? 'Could not create account. Please try again.')
        } else {
          setApiError('An unexpected error occurred. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [signup]
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900" style={{ textWrap: 'balance' }}>
          Create account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Start monitoring your procurement spend.
        </p>
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Full name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            disabled={isLoading}
            className={cn(inputBase, errors.name && inputError)}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Work email
          </label>
          <input
            id="signup-email"
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

        {/* Role selector */}
        <div>
          <label
            htmlFor="signup-role"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Role
          </label>
          <select
            id="signup-role"
            disabled={isLoading}
            className={cn(
              inputBase,
              'appearance-none bg-white cursor-pointer',
              errors.role && inputError
            )}
            {...register('role')}
          >
            <option value="">Select your role…</option>
            {ROLE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        {/* Confirm password */}
        <div>
          <label
            htmlFor="signup-confirm"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat password"
              disabled={isLoading}
              className={cn(inputBase, 'pr-10', errors.confirmPassword && inputError)}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </div>
  )
}
