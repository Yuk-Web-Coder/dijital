import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react'

export const metadata = {
  title: '利用規約 | デジタルアトリエ',
  description: 'デジタルアトリエの利用規約です。',
}

export default function TermsPage() {
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
            <FileText size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Terms of Service</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text)' }}>利用規約</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
            最終更新日: 2026年9月15日
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7, color: 'var(--color-text)' }}>
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>第1条（適用）</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              本利用規約（以下「本規約」）は、デジタルアトリエ（以下「当サービス」）が提供するイラスト投稿・共有サービスおよびこれに付随するすべての機能の利用条件を定めるものです。ユーザーは、本規約に同意した上で当サービスを利用するものとします。
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>第2条（著作権とフォーク・書き足し許諾）</h2>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <strong>著作権の帰属:</strong> ユーザーが当サービスに投稿した画像・作品（以下「投稿作品」）の著作権は、投稿したユーザー本人に帰属します。
              </li>
              <li>
                <strong>フォーク（書き足し・連作）機能の許諾:</strong> 当サービスでは、投稿者が設定したフォーク権限（`fork_permission`）に基づき、他のユーザーが投稿作品を元に書き足し・背景追加・線画の利用等の二次的利用（以下「フォーク」）を行うことができます。投稿者は、フォーク権限を非ロック（許可）に設定して投稿した場合、他のユーザーに対して本サービス内でのフォーク・リミックス行為を非独占的に許諾したものとみなします。
              </li>
              <li>
                <strong>著作者人格権の不行使:</strong> ユーザーは、設定されたフォーク権限の範囲内で行われた他ユーザーの健全なフォーク作品に対し、同一性保持権等の著作者人格権を行使しないものとします。
              </li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>第3条（禁止事項）</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              ユーザーは、当サービスの利用にあたり、以下の行為を行ってはなりません。
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>第三者の著作権、商標権、プライバシー権その他の権利を侵害する行為（無断転載画像の投稿を含む）</li>
              <li>公序良俗に反するコンテンツ、差別的または攻撃的なコンテンツの投稿</li>
              <li>事実に反する情報の流布や他者へのなりすまし</li>
              <li>当サービスのサーバーやネットワークに過度な負荷をかける行為・不正アクセス</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>第4条（投稿コンテンツの非表示・削除）</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              当サービスは、投稿作品が本規約に違反する場合、または権利者からの通報・不適切な内容との報告（リポート）があった場合、投稿者への事前通知なく、該当作品を非表示（ブラインド化）または削除できるものとします。
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>第5条（免責事項）</h2>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>当サービスは、サービス内容の確実性、正確性、特定目的への適合性を保証するものではありません。</li>
              <li>ユーザー同士のトラブル（権利侵害トラブルを含む）について、当サービスに故意または重過失がある場合を除き、一切の責任を負いません。</li>
              <li>システムの保守・障害等によりサービスが停止した場合に生じた損害について責任を負いません。</li>
            </ol>
          </section>

          <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} />
              <span>ご不明な点がある場合は、<Link href="/contact" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>お問い合わせフォーム</Link> よりご連絡ください。</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
