import Link from 'next/link'
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'プライバシーポリシー | デジタルアトリエ',
  description: 'デジタルアトリエのプライバシーポリシーです。',
}

export default function PrivacyPage() {
  return (
    <div className="container container--narrow" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={14} />
          トップページへ戻る
        </Link>
      </div>

      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--pigment-blue)', marginBottom: '0.5rem' }}>
            <Lock size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Privacy Policy</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text)' }}>プライバシーポリシー</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
            最終更新日: 2026年9月15日
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7, color: 'var(--color-text)' }}>
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>1. 取得する情報</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              当サービス（デジタルアトリエ）では、サービスの提供にあたり以下の情報を取得・利用します。
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <li><strong>アカウント情報:</strong> メールアドレス、表示名、プロフィール画像、自己紹介文</li>
              <li><strong>投稿コンテンツ:</strong> ユーザーが投稿した画像データ、コメント、チャットメッセージ、タグ</li>
              <li><strong>アクセスログ・Cookie:</strong> サービス改善およびセキュリティ維持のためのアクセスログやクッキー情報</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>2. 情報の利用目的</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              取得した情報は、以下の目的で安全に利用されます。
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <li>アカウントの認証および本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせやトラブル対応のため</li>
              <li>利用規約違反行為や不正利用の監視・対応のため</li>
              <li>サービスの機能改善および新機能開発の参考とするため</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>3. 第三者提供の制限</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              当サービスは、法令に基づく場合や不正利用への正当な対応に必要な場合を除き、取得した個人情報をユーザーの同意なく第三者に提供することはありません。
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>4. 安全管理措置</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              当サービスは、Supabase による暗号化インフラを使用し、データへの不正アクセスや紛失、改ざんを防ぐための適切な技術的・組織的安全管理措置を実施します。
            </p>
          </section>

          <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} />
              <span>プライバシーに関するご質問は、<Link href="/contact" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>お問い合わせフォーム</Link> よりご連絡ください。</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
