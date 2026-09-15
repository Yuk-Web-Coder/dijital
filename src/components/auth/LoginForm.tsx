'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, PenLine } from 'lucide-react'

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません')
        return
      }
      router.push(redirectTo ?? '/threads')
      router.refresh()
    })
  }

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--pigment-blue)', display:'flex', justifyContent:'center' }}><PenLine size={36} strokeWidth={1.25} /></div>
        <h1 className="auth-title">ログイン</h1>
        <p className="auth-subtitle">描いたから、とりあえず置いていく場所へ</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            <Mail size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
            メールアドレス
          </label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            <Lock size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
            パスワード
          </label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            minLength={6}
          />
        </div>

        {error && (
          <div className="alert alert--error" role="alert">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={isPending}
          style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
        >
          <LogIn size={15} />
          {isPending ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div>
          <Link href="/auth/reset-password" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>
            パスワードをお忘れの方はこちら
          </Link>
        </div>
        <div>
          アカウントがない方は{' '}
          <Link href="/auth/signup" style={{ color: 'var(--color-accent)' }}>
            新規登録
          </Link>
        </div>
      </div>
    </div>
  )
}
