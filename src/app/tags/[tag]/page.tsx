import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Artwork } from '@/types'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import { ReactionDisplay } from '@/components/artwork/ReactionDisplay'
import { Tag as TagIcon, ArrowLeft, User } from 'lucide-react'
import type { Metadata } from 'next'
import type { ForkPermission } from '@/types'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  return {
    title: `#${decodedTag} の作品一覧`,
    description: `#${decodedTag} タグが付いた作品一覧`,
  }
}

export default async function TagArtworksPage({ params }: Props) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const supabase = await createClient()

  // tags 配列に decodedTag が含まれる作品を取得
  const { data: artworks } = await supabase
    .from('artworks')
    .select(`
      *,
      author:profiles!author_id(id, display_name),
      reactions(reaction_type)
    `)
    .contains('tags', [decodedTag])
    .eq('is_blinded', false)
    .order('created_at', { ascending: false })
    .limit(50)

  const artworkList = (artworks ?? []) as (Artwork & {
    reactions: { reaction_type: string }[]
  })[]

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
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>トップへ戻る</span>
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
          <TagIcon className="w-6 h-6 text-[var(--color-accent)]" />
          <span>#{decodedTag}</span>
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          #{decodedTag} タグの作品 ({artworksWithReactionCounts.length} 件)
        </p>
      </div>

      {artworksWithReactionCounts.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] rounded-2xl">
          このタグの作品はまだありません。
        </div>
      ) : (
        <div className="artwork-grid stagger">
          {artworksWithReactionCounts.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/artwork/${artwork.id}`}
              className="artwork-card"
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
                  <ForkBadge permission={artwork.fork_permission as ForkPermission} compact />
                </span>
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
      )}
    </div>
  )
}
