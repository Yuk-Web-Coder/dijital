import Link from 'next/link'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function ConfirmPage() {
  return (
    <div className="container container--narrow py-16">
      <div className="auth-card text-center">
        <div className="flex justify-center text-[var(--pigment-blue)] mb-3">
          <Mail size={42} strokeWidth={1.25} />
        </div>
        <h1 className="auth-title">確認メールをご確認ください</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
          ご登録いただいたメールアドレスに確認メールを送信しました。<br />
          メールに記載された承認リンクをクリックすると、アカウント登録が完了します。
        </p>

        <div className="mt-8 pt-6 border-t border-[var(--color-border-soft)] flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--pigment-green)] font-medium">
            <CheckCircle2 size={14} />
            メール認証完了後、自動的にログイン可能になります
          </div>
          <Link href="/auth/login" className="btn btn--outline mt-2">
            ログイン画面へ進む
          </Link>
        </div>
      </div>
    </div>
  )
}
