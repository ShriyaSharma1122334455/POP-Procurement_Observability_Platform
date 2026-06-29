import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <AuthCard
      bottomLink={{
        text: "Don't have an account?",
        href: '/signup',
        linkText: 'Sign up',
      }}
    >
      <LoginForm />
    </AuthCard>
  )
}
