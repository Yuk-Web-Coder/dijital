import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'アカウント作成',
}

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: 'calc(100dvh - var(--header-h))',
        display: 'flex',
        alignItems: 'center',
        padding: '2rem 1rem',
      }}
    >
      <SignupForm />
    </div>
  )
}
