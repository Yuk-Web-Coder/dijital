import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'ログイン',
}

interface Props {
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <div
      style={{
        minHeight: 'calc(100dvh - var(--header-h))',
        display: 'flex',
        alignItems: 'center',
        padding: '2rem 1rem',
      }}
    >
      <LoginForm redirectTo={params.redirectTo} />
    </div>
  )
}
