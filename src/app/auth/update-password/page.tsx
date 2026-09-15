'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, KeyRound } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError('パスワードの更新に失敗しました: ' + error.message)
        return
      }
      alert('パスワードを更新しました。新しいパスワードでログインしてください。')
      router.push('/auth/login')
    })
  }

  return (
    <div className="container container--narrow py-12">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--pigment-blue)', display: 'flex', justifyContent: 'center' }}>
            <KeyRound size={36} strokeWidth={1.25} />
          </div>
          <h1 className="auth-title">新しいパスワードの設定</h1>
          <p className="auth-subtitle">新しいパスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              <Lock size={13} className="inline mr-1" />
              新しいパスワード
            </label>
            <input
              id="new-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              <Lock size={13} className="inline mr-1" />
              パスワード（確認）
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              required
              minLength={6}
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
            {isPending ? '更新中…' : 'パスワードを保存する'}
          </button>
        </form>
      </div>
    </div>
  )
}
