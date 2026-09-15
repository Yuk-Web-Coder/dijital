import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import { ReactionDisplay } from '@/components/artwork/ReactionDisplay'
import { Search, Tag as TagIcon, User, Filter } from 'lucide-react'
import type { Metadata } from 'next'
import type { Artwork, ForkPermission } from '@/types'

export const metadata: Metadata = {
  title: '作品検索 | デジタルアトリエ',
  description: 'キーワードやタグで全国のアトリエの投稿作品を検索',
}

interface Props {
  searchParams: Promise<{ q?: string; permission?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', permission = 'ALL' } = await searchParams
  const query = q.trim()
  const supabase = await createClient()

  let artworks: (Artwork & { reactions: { reaction_type: string }[] })[] = []

  if (query || permission !== 'ALL') {
    let req = supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!author_id(id, display_name),
        reactions(reaction_type)
      `)
      .eq('is_blinded', false)
      .order('created_at', { ascending: false })
      .limit(60)

    if (query) {
      req = req.or(`comment.ilike.%${query}%`)
    }

    if (permission !== 'ALL') {
      req = req.eq('fork_permission', permission)
    }

    const { data } = await req
    artworks = (data ?? []) as (Artwork & { reactions: { reaction_type: string }[] })[]
  } else {
    // デフォルトで最新作品24件表示
    const { data } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!author_id(id, display_name),
        reactions(reaction_type)
      `)
      .eq('is_blinded', false)
      .order('created_at', { ascending: false })
      .limit(24)

    artworks = (data ?? []) as (Artwork & { reactions: { reaction_type: string }[] })[]
  }

  const artworksWithReactionCounts = artworks.map((a) => {
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
    <div className="container py-8 space-y-8">
      {/* 検索ヘッダー */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Search className="w-6 h-6 text-[var(--pigment-blue)]" />
          <span>作品を検索</span>
        </h1>
        <p className="page-subtitle">キーワードや二次創作許可の条件で作品を探せます</p>

        <form action="/search" method="GET" className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="キーワードで検索 (例: 練習, 背景, 下書き)"
              className="form-input pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--ink-muted)]" />
            <select
              name="permission"
              defaultValue={permission}
              className="form-input text-xs w-44"
            >
              <option value="ALL">許可条件: すべて</option>
              <option value="ANY">何でも自由</option>
              <option value="COLOR_ONLY">着色のみ可</option>
              <option value="BACKGROUND_ONLY">背景のみ可</option>
              <option value="LOCKED">描き足し不可</option>
            </select>

            <button type="submit" className="btn btn--primary text-xs shrink-0">
              検索する
            </button>
          </div>
        </form>
      </div>

      {/* 検索結果 */}
      <div>
        <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3 mb-6">
          <h2 className="text-xs font-serif text-[var(--color-text-muted)]">
            {query ? `「${query}」の検索結果 (${artworksWithReactionCounts.length} 件)` : `最新の作品 (${artworksWithReactionCounts.length} 件)`}
          </h2>
        </div>

        {artworksWithReactionCounts.length > 0 ? (
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
        ) : (
          <div className="py-16 text-center text-xs text-[var(--color-text-muted)] bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs">
            該当する作品が見つかりませんでした。条件を変えてお試しください。
          </div>
        )}
      </div>
    </div>
  )
}
