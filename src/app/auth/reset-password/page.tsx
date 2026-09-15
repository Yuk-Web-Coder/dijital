'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, Send } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const redirectTo = `${window.location.origin}/auth/update-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) {
        setError('再設定メールの送信に失敗しました: ' + error.message)
        return
      }
      setSuccess(true)
    })
  }

  return (
    <div className="container container--narrow py-12">
      <div className="auth-card">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4"
        >
          <ArrowLeft size={13} />
          <span>ログイン画面へ戻る</span>
        </Link>

        <h1 className="auth-title">パスワード再設定</h1>
        <p className="auth-subtitle">
          ご登録のメールアドレスを入力してください。再設定用リンクを送信します。
        </p>

        {success ? (
          <div className="mt-4 p-4 bg-[var(--pigment-blue-lt)] border border-[var(--pigment-blue)] rounded text-xs text-[var(--pigment-blue)]">
            <strong>{email}</strong> 宛に再設定リンクを送信しました。<br />
            メール内のリンクから新しいパスワードを設定してください。
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">
                <Mail size={13} className="inline mr-1" />
                メールアドレス
              </label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary w-full justify-center py-2.5"
              disabled={isPending}
            >
              <Send size={15} />
              {isPending ? '送信中…' : '再設定メールを送信'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
