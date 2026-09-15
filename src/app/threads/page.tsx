import { createClient } from '@/lib/supabase/server'
import type { Thread } from '@/types'
import { CreateThreadModal } from '@/components/thread/CreateThreadModal'
import { ThreadSearchClient } from '@/components/thread/ThreadSearchClient'
import { MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '掲示板',
  description: 'デジタルアトリエのスレッド一覧。落書き供養・塗り絵・背景練習などカテゴリ別にスレッドがあります。',
}

export default async function ThreadsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: threads, error } = await supabase
    .from('threads')
    .select('*, artworks(count)')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="container" style={{ paddingBlock: '2rem' }}>
        <div className="alert alert--error">スレッドの読み込みに失敗しました。</div>
      </div>
    )
  }

  const threadList = (threads ?? []) as (Thread & { artworks: { count: number }[] })[]

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[var(--color-border-soft)] pb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[var(--color-accent)]" />
            <span>掲示板スレッド</span>
          </h1>
          <p className="page-subtitle">
            テーマ別スレッド。好きなテーマでスレッドを立てたり投稿・雑談を楽しめます。
          </p>
        </div>

        {user && (
          <div>
            <CreateThreadModal />
          </div>
        )}
      </div>

      <ThreadSearchClient threads={threadList} />
    </div>
  )
}

