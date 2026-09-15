import Link from 'next/link'
import { PenLine } from 'lucide-react'

export function Footer() {
  return (
    <footer className="site-footer" style={{
      borderTop: '1px solid var(--color-border)',
      marginTop: '4rem',
      padding: '2.5rem 0',
      backgroundColor: 'var(--color-surface, #1e293b)',
      fontSize: '0.85rem',
      color: 'var(--color-text-muted)'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: 'var(--pigment-blue-light, rgba(59, 130, 246, 0.1))',
            color: 'var(--pigment-blue, #3b82f6)'
          }}>
            <PenLine size={13} strokeWidth={1.5} />
          </span>
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>デジタルアトリエ</span>
          <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>© {new Date().getFullYear()} Digital Atelier</span>
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/terms" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            利用規約
          </Link>
          <Link href="/privacy" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            プライバシーポリシー
          </Link>
          <Link href="/contact" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            お問い合わせ
          </Link>
        </nav>
      </div>
    </footer>
  )
}
