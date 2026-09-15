import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'デジタルアトリエ',
    template: '%s | デジタルアトリエ',
  },
  description: '描いたから、とりあえず置いていく場所。落書き・WIP・練習絵を気兼ねなく投稿できる、非競争型の絵描きプラットフォーム。',
  keywords: ['イラスト', '落書き', 'WIP', '練習絵', '共同創作', '非競争'],
  openGraph: {
    title: 'デジタルアトリエ',
    description: '描いたから、とりあえず置いていく場所。',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

