import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Artwork, ArtworkComment, ForkPermission } from '@/types'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import { ReactionDisplay } from '@/components/artwork/ReactionDisplay'
import { DeleteArtworkButton } from '@/components/artwork/DeleteArtworkButton'
import { ReportModal } from '@/components/artwork/ReportModal'
import { WipProgressViewer } from '@/components/artwork/WipProgressViewer'
import { ArtworkCommentChat } from '@/components/artwork/ArtworkCommentChat'
import { FollowButton } from '@/components/user/FollowButton'
import { BookmarkButton } from '@/components/artwork/BookmarkButton'
import { ForkChoiceModal } from '@/components/artwork/ForkChoiceModal'
import { getArtworkComments } from '@/lib/actions/comments'
import { getFollowStatus } from '@/lib/actions/follows'
import { getBookmarkStatus } from '@/lib/actions/bookmarks'
import { GitFork, ArrowLeft, Network, Tag as TagIcon, User } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('artworks')
    .select('comment, author:profiles!author_id(display_name)')
    .eq('id', id)
    .single()

  const titleText = data?.comment ? `${data.comment.slice(0, 40)}…` : '作品詳細'
  const authorName = (data?.author as { display_name?: string } | null)?.display_name ?? '名無し'
  const ogImageUrl = `/api/og?title=${encodeURIComponent(titleText)}&author=${encodeURIComponent(authorName)}`

  return {
    title: titleText,
    description: `${authorName}さんの投稿作品`,
    openGraph: {
      title: titleText,
      description: `${authorName}さんの投稿作品`,
      images: [ogImageUrl],
    },
  }
}

export default async function ArtworkDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // 1. 作品単体を取得
  const { data: artwork, error: artworkError } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', id)
    .single()

  if (artworkError || !artwork) {
    console.error('Artwork fetch error:', JSON.stringify(artworkError))
    notFound()
  }

  if (artwork.is_blinded) notFound()

  // 2. 作者プロフィール、スレッド、リアクションをそれぞれ安全に取得
  const { data: author } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', artwork.author_id)
    .single()

  const { data: thread } = await supabase
    .from('threads')
    .select('id, title, category_type')
    .eq('id', artwork.thread_id)
    .single()

  const { data: reactions } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('artwork_id', id)

  // コメント取得
  const comments: ArtworkComment[] = await getArtworkComments(id)

  // Parent artwork
  const { data: parentArtwork } = artwork.parent_artwork_id
    ? await supabase
        .from('artworks')
        .select('id, image_url, author:profiles!author_id(display_name)')
        .eq('id', artwork.parent_artwork_id)
        .single()
    : { data: null }

  // Children count
  const { count: childrenCount } = await supabase
    .from('artworks')
    .select('id', { count: 'exact', head: true })
    .eq('parent_artwork_id', id)
    .eq('is_blinded', false)

  // Follow status
  const followStatus = currentUser && currentUser.id !== artwork.author_id
    ? await getFollowStatus(artwork.author_id)
    : { isFollowing: false }

  // Bookmark status
  const isBookmarked = currentUser ? await getBookmarkStatus(id) : false

  // Reaction counts
  const reactionMap = new Map<string, number>()
  reactions?.forEach((r: { reaction_type: string }) => {
    reactionMap.set(r.reaction_type, (reactionMap.get(r.reaction_type) ?? 0) + 1)
  })
  const reactionCounts = Array.from(reactionMap.entries()).map(([reaction_type, count]) => ({
    reaction_type,
    count,
  }))

  const a = {
    ...artwork,
    author: author ?? { id: artwork.author_id, display_name: '名無し' },
    thread: thread ?? { id: artwork.thread_id, title: 'スレッド', category_type: '雑談' },
  } as Artwork & {
    author: { id: string; display_name: string }
    thread: { id: string; title: string; category_type: string }
  }

  const canFork = a.fork_permission !== 'LOCKED'
  const isOwner = currentUser?.id === a.author_id

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>
      {/* 戻るリンク ＆ 削除ボタン */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/threads/${a.thread_id}`}
          className="btn btn--ghost btn--sm"
        >
          <ArrowLeft size={14} />
          {a.thread?.title ?? 'スレッドに戻る'}
        </Link>

        {isOwner && (
          <DeleteArtworkButton artworkId={id} />
        )}
      </div>

      {/* 派生元インジケーター */}
      {parentArtwork && (
        <div className="lineage-indicator mb-4">
          <GitFork size={12} />
          <span>派生元:</span>
          <Link
            href={`/artwork/${parentArtwork.id}`}
            style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
          >
            {(parentArtwork.author as { display_name?: string } | null)?.display_name ?? '名無し'}さんの作品
          </Link>
          <Image
            src={parentArtwork.image_url}
            alt="派生元作品のサムネイル"
            width={32}
            height={32}
            style={{ borderRadius: 4, objectFit: 'cover', marginLeft: 'auto' }}
          />
        </div>
      )}

      {/* 2カラムレイアウト: 左側(作品・Meta) ＋ 右側(大型個別チャット) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 左カラム (画像・ビューア・情報) */}
        <div className="lg:col-span-2 space-y-6">
          {/* WIP制作過程ビューア ＆ メイン画像 */}
          <WipProgressViewer
            mainImageUrl={a.image_url}
            progressImages={a.progress_images}
            comment={a.comment}
          />

          {/* 作者プロフィール ＆ フォロー ＆ ブックマーク */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
            <Link href={`/atelier/${a.author_id}`} className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                <User size={16} strokeWidth={1.5} />
                <div>
                  <div className="font-bold text-[var(--color-text)]">{a.author?.display_name ?? '名無し'}</div>
                  <div className="text-xs text-[var(--color-text-faint)]">
                    {new Date(a.created_at).toLocaleDateString('ja-JP', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })} 投稿
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {currentUser && (
                <BookmarkButton
                  artworkId={id}
                  initialIsBookmarked={isBookmarked}
                />
              )}

              {!isOwner && currentUser && (
                <FollowButton
                  targetUserId={a.author_id}
                  initialIsFollowing={followStatus.isFollowing}
                />
              )}

              <span className={`artwork-card__fork-badge perm-badge--${a.fork_permission}`} style={{ position: 'static', fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                <ForkBadge permission={a.fork_permission} />
              </span>
            </div>
          </div>

          {/* キャプションコメント */}
          {a.comment && (
            <p className="text-sm leading-relaxed text-[var(--color-text)] bg-[var(--color-surface-2)] p-4 rounded border border-[var(--color-border-soft)]">
              {a.comment}
            </p>
          )}

          {/* タグ */}
          {a.tags && a.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              {a.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-2.5 py-1 rounded-md hover:opacity-80 transition-opacity"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* リアクション */}
          <div>
            <div className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">
              リアクション
            </div>
            <ReactionDisplay
              artworkId={id}
              counts={reactionCounts}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-soft)] flex-wrap">
            {canFork && (
              <ForkChoiceModal
                artworkId={id}
                imageUrl={a.image_url}
                authorName={(a.author as { display_name?: string } | null)?.display_name ?? '名無し'}
                forkPermission={a.fork_permission as ForkPermission}
              />
            )}

            <Link href={`/artwork/${id}/lineage`} className="btn btn--ghost">
              <Network size={14} />
              作品の系譜ツリー {childrenCount != null && childrenCount > 0 ? `(${childrenCount})` : ''}
            </Link>

            <div className="ml-auto">
              <ReportModal artworkId={id} />
            </div>
          </div>
        </div>

        {/* 右カラム (大型個別作品チャット) */}
        <div className="lg:col-span-1 lg:sticky lg:top-20">
          <ArtworkCommentChat
            artworkId={id}
            initialComments={comments}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>
    </div>
  )
}
