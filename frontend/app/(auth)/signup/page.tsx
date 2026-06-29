import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = { title: 'Create account' }

export default function SignupPage() {
  return (
    <AuthCard
      bottomLink={{
        text: 'Already have an account?',
        href: '/login',
        linkText: 'Sign in',
      }}
    >
      <SignupForm />
    </AuthCard>
  )
}
