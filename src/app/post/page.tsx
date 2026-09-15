import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/artwork/PostForm'
import type { Metadata } from 'next'
import type { Thread } from '@/types'

export const metadata: Metadata = {
  title: '投稿する',
  description: '作品を投稿する',
}

interface Props {
  searchParams: Promise<{ thread?: string; fork?: string }>
}

export default async function PostPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/post')
  }

  const params = await searchParams
  const threadId = params.thread
  const forkId = params.fork

  // スレッド一覧取得
  const { data: threads } = await supabase
    .from('threads')
    .select('id, title, category_type')
    .order('created_at', { ascending: true })

  // フォーク元作品取得
  const { data: parentArtwork } = forkId
    ? await supabase
        .from('artworks')
        .select('id, image_url, comment, fork_permission, author:profiles!author_id(display_name)')
        .eq('id', forkId)
        .single()
    : { data: null }

  return (
    <div className="container container--narrow" style={{ paddingBlock: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">
          {parentArtwork ? '続きを描く（フォーク投稿）' : '投稿する'}
        </h1>
        <p className="page-subtitle">
          完成してなくていい。とりあえず置いていこう。
        </p>
      </div>

      <PostForm
        threads={(threads ?? []) as Thread[]}
        defaultThreadId={threadId}
        parentArtwork={parentArtwork as {
          id: string
          image_url: string
          comment: string | null
          fork_permission: string
          author: { display_name: string }
        } | null}
      />
    </div>
  )
}
