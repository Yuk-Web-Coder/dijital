'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, UserCheck, PenLine } from 'lucide-react'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const [agreedToTerms, setAgreedToTerms] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreedToTerms) {
      setError('利用規約およびプライバシーポリシーへの同意が必要です。')
      return
    }
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || '名無し' },
        },
      })
      if (error) {
        if (error.message.includes('already registered')) {
          setError('このメールアドレスはすでに登録されています')
        } else {
          setError('登録に失敗しました: ' + error.message)
        }
        return
      }
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--pigment-blue)', display:'flex', justifyContent:'center' }}>
          <Mail size={36} strokeWidth={1.25} />
        </div>
        <h1 className="auth-title">確認メールを送信しました</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: '0.5rem' }}>
          <strong>{email}</strong> に確認メールを送りました。
          <br />
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <Link href="/" className="btn btn--ghost" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
          トップに戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--pigment-blue)', display:'flex', justifyContent:'center' }}>
          <PenLine size={36} strokeWidth={1.25} />
        </div>
        <h1 className="auth-title">アカウント作成</h1>
        <p className="auth-subtitle">表示名はデフォルト「名無し」。いつでも変えられます。</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-name">
            表示名（任意）
          </label>
          <input
            id="signup-name"
            type="text"
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="名無し"
            maxLength={50}
            autoComplete="nickname"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">
            <Mail size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
            メールアドレス（非公開）
          </label>
          <input
            id="signup-email"
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
          <label className="form-label" htmlFor="signup-password">
            <Lock size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
            パスワード
          </label>
          <input
            id="signup-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <div className="form-group" style={{ marginTop: '0.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              required
              style={{ marginTop: '0.15rem', cursor: 'pointer' }}
            />
            <span>
              <Link href="/terms" target="_blank" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>利用規約</Link>
              および
              <Link href="/privacy" target="_blank" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>プライバシーポリシー</Link>
              に同意する
            </span>
          </label>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={isPending || !agreedToTerms}
          style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
        >
          <UserCheck size={15} />
          {isPending ? '登録中…' : '登録する（無料）'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        すでにアカウントをお持ちの方は{' '}
        <Link href="/auth/login" style={{ color: 'var(--color-accent)' }}>
          ログイン
        </Link>
      </div>
    </div>
  )
}
