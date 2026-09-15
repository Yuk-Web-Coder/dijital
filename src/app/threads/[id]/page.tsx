import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Artwork, Thread, ThreadMessage } from '@/types'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import { ReactionDisplay } from '@/components/artwork/ReactionDisplay'
import { ThreadChat } from '@/components/chat/ThreadChat'
import { getThreadMessages } from '@/lib/actions/chat'
import { GitFork, PenLine, User, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: thread } = await supabase
    .from('threads')
    .select('title, description')
    .eq('id', id)
    .single()

  return {
    title: thread?.title ?? 'スレッド',
    description: thread?.description ?? '',
  }
}

const PAGE_SIZE = 12

export default async function ThreadDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { page: pageStr } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  const supabase = await createClient()

  // スレッド情報取得
  const { data: thread } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .single()

  if (!thread) notFound()

  // 作品総数取得
  const { count: totalArtworksCount } = await supabase
    .from('artworks')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', id)
    .eq('is_blinded', false)

  const totalCount = totalArtworksCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1
  const offset = (currentPage - 1) * PAGE_SIZE

  // 作品一覧取得（ページネーション付き）
  const { data: artworks } = await supabase
    .from('artworks')
    .select(`
      *,
      author:profiles!author_id(id, display_name),
      reactions(reaction_type)
    `)
    .eq('thread_id', id)
    .eq('is_blinded', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  // 初期チャットメッセージ取得
  const chatMessages: ThreadMessage[] = await getThreadMessages(id)

  const threadData = thread as Thread
  const artworkList = (artworks ?? []) as (Artwork & {
    reactions: { reaction_type: string }[]
  })[]

  // リアクション集計
  const artworksWithReactionCounts = artworkList.map((a) => {
    const reactionMap = new Map<string, number>()
    a.reactions?.forEach((r) => {
      reactionMap.set(r.reaction_type, (reactionMap.get(r.reaction_type) ?? 0) + 1)
    })
    return {
      ...a,
      reactionCounts: Array.from(reactionMap.entries()).map(([reaction_type, count]) => ({
        reaction_type,
        count,
      })),
    }
  })

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>
      {/* スレッドヘッダー */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className={`thread-item__category cat--${threadData.category_type}`}>
              {threadData.category_type}
            </span>
          </div>
          <h1 className="page-title">{threadData.title}</h1>
          {threadData.description && (
            <p className="page-subtitle">{threadData.description}</p>
          )}
        </div>

        <div>
          <Link href={`/post?thread=${id}`} className="btn btn--primary">
            <PenLine size={15} />
            <span>このスレッドに絵を置く</span>
          </Link>
        </div>
      </div>

      {/* 2カラムレイアウト: 左 掲示板チャット, 右 作品一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左: リアルタイム雑談・スタンプ掲示板 (lg: 5コラム) */}
        <div className="lg:col-span-5 bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs p-4 shadow-xs sticky top-20">
          <ThreadChat threadId={id} initialMessages={chatMessages} />
        </div>

        {/* 右: 投稿作品一覧 (lg: 7コラム) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3">
            <h2 className="text-lg font-bold text-[var(--ink-primary)] flex items-center gap-2">
              <span>投稿作品一覧 ({totalCount})</span>
            </h2>
          </div>

          {artworksWithReactionCounts.length === 0 ? (
            <div className="bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs p-12 text-center text-[var(--color-text-muted)] space-y-3">
              <div className="flex justify-center text-[var(--pigment-blue)]">
                <PenLine size={36} strokeWidth={1.25} />
              </div>
              <p className="text-xs">まだ投稿がありません。最初の一枚を描きませんか？</p>
              <Link href={`/post?thread=${id}`} className="btn btn--primary inline-flex">
                投稿する
              </Link>
            </div>
          ) : (
            <>
              <div className="artwork-grid stagger">
                {artworksWithReactionCounts.map((artwork) => (
                  <Link
                    key={artwork.id}
                    href={`/artwork/${artwork.id}`}
                    className="artwork-card"
                    aria-label={`${artwork.author?.display_name ?? '名無し'}さんの作品`}
                  >
                    <div className="artwork-card__image-wrap">
                      <Image
                        src={artwork.image_url}
                        alt={artwork.comment ?? '投稿画像'}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <span className={`artwork-card__fork-badge perm-badge--${artwork.fork_permission}`}>
                        <ForkBadge permission={artwork.fork_permission} compact />
                      </span>
                      {artwork.parent_artwork_id && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            background: 'rgba(0,0,0,0.75)',
                            borderRadius: 2,
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.68rem',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <GitFork size={10} />
                          派生
                        </span>
                      )}
                    </div>
                    <div className="artwork-card__body">
                      <div className="artwork-card__author">
                        <User size={12} strokeWidth={1.5} />
                        {artwork.author?.display_name ?? '名無し'}
                      </div>
                      {artwork.comment && (
                        <p className="artwork-card__comment">{artwork.comment}</p>
                      )}
                      {artwork.reactionCounts.length > 0 && (
                        <ReactionDisplay counts={artwork.reactionCounts} compact />
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-[var(--color-border-soft)]">
                  {currentPage > 1 ? (
                    <Link
                      href={`/threads/${id}?page=${currentPage - 1}`}
                      className="btn btn--outline text-xs"
                    >
                      <ChevronLeft size={14} />
                      <span>前へ</span>
                    </Link>
                  ) : (
                    <button disabled className="btn btn--outline text-xs opacity-40">
                      <ChevronLeft size={14} />
                      <span>前へ</span>
                    </button>
                  )}

                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    {currentPage} / {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={`/threads/${id}?page=${currentPage + 1}`}
                      className="btn btn--outline text-xs"
                    >
                      <span>次へ</span>
                      <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <button disabled className="btn btn--outline text-xs opacity-40">
                      <span>次へ</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
