'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitInquiry, ContactState } from '@/lib/actions/contact'
import { Mail, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

const initialState: ContactState = {}

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitInquiry, initialState)

  return (
    <div className="container container--narrow" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={14} />
          トップページへ戻る
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--pigment-blue-light, rgba(59, 130, 246, 0.1))',
            color: 'var(--pigment-blue, #3b82f6)',
            marginBottom: '1rem'
          }}>
            <Mail size={24} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            お問い合わせ
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '460px', margin: '0 auto' }}>
            デジタルアトリエに関するご質問、不具合報告、権利侵害・削除依頼などはこちらからお願いいたします。
          </p>
        </div>

        {state.success ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--pigment-green, #10b981)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>送信が完了しました</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              お問い合わせありがとうございます。<br />
              内容を確認のうえ、必要に応じて担当よりご連絡いたします。
            </p>
            <Link href="/" className="btn btn--primary">
              トップページに戻る
            </Link>
          </div>
        ) : (
          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {state.error && (
              <div className="alert alert--error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{state.error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="contact-name">
                お名前 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="山田 太郎"
                required
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-email">
                メールアドレス <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                required
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-category">
                お問い合わせ種別 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="contact-category"
                name="category"
                className="form-input"
                defaultValue="general"
                required
              >
                <option value="general">サービスに関する質問</option>
                <option value="bug">不具合・バグの報告</option>
                <option value="copyright">権利侵害・作品削除のご依頼</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-message">
                お問い合わせ内容 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                className="form-input"
                rows={6}
                placeholder="具体的にお書きください（10文字以上2000文字以内）"
                required
                minLength={10}
                maxLength={2000}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isPending}
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                <Send size={15} />
                {isPending ? '送信中…' : '送信する'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
