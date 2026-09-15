'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import { DeleteArtworkButton } from '@/components/artwork/DeleteArtworkButton'
import { Palette, GitFork, Bookmark, Lock, ChevronLeft, ChevronRight, User } from 'lucide-react'
import type { ForkPermission, Artwork } from '@/types'

interface AtelierTabContentProps {
  ownArtworks: Artwork[]
  forkedArtworks: Artwork[]
  bookmarkedArtworks: Artwork[]
  isMe: boolean
}

const ITEMS_PER_PAGE = 12

export function AtelierTabContent({
  ownArtworks,
  forkedArtworks,
  bookmarkedArtworks,
  isMe,
}: AtelierTabContentProps) {
  const [activeTab, setActiveTab] = useState<'own' | 'forked' | 'bookmarked'>('own')
  const [page, setPage] = useState(1)

  const currentList =
    activeTab === 'own'
      ? ownArtworks
      : activeTab === 'forked'
      ? forkedArtworks
      : bookmarkedArtworks

  const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE) || 1
  const paginatedList = currentList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  function handleTabChange(tab: 'own' | 'forked' | 'bookmarked') {
    setActiveTab(tab)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* タブ切り替えバー */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-soft)] pb-2 flex-wrap">
        <button
          onClick={() => handleTabChange('own')}
          className={`px-3 py-1.5 text-xs font-serif rounded-xs border transition-colors flex items-center gap-1.5 ${
            activeTab === 'own'
              ? 'bg-[var(--pigment-blue)] text-white border-[var(--pigment-blue)] font-bold'
              : 'bg-[var(--surface-paper)] text-[var(--ink-primary)] border-[var(--color-border-soft)] hover:bg-[var(--bg-gesso)]'
          }`}
        >
          <Palette size={13} />
          <span>投稿作品 ({ownArtworks.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('forked')}
          className={`px-3 py-1.5 text-xs font-serif rounded-xs border transition-colors flex items-center gap-1.5 ${
            activeTab === 'forked'
              ? 'bg-[var(--pigment-blue)] text-white border-[var(--pigment-blue)] font-bold'
              : 'bg-[var(--surface-paper)] text-[var(--ink-primary)] border-[var(--color-border-soft)] hover:bg-[var(--bg-gesso)]'
          }`}
        >
          <GitFork size={13} />
          <span>派生作品 ({forkedArtworks.length})</span>
        </button>

        {isMe && (
          <button
            onClick={() => handleTabChange('bookmarked')}
            className={`px-3 py-1.5 text-xs font-serif rounded-xs border transition-colors flex items-center gap-1.5 ${
              activeTab === 'bookmarked'
                ? 'bg-[var(--pigment-red)] text-white border-[var(--pigment-red)] font-bold'
                : 'bg-[var(--surface-paper)] text-[var(--ink-primary)] border-[var(--color-border-soft)] hover:bg-[var(--bg-gesso)]'
            }`}
          >
            <Bookmark size={13} />
            <span>ブックマーク ({bookmarkedArtworks.length})</span>
            <Lock size={10} className="opacity-80" />
          </button>
        )}
      </div>

      {activeTab === 'bookmarked' && isMe && (
        <div className="p-3 bg-[var(--pigment-blue-lt)] border border-[var(--pigment-blue)] text-xs text-[var(--pigment-blue)] rounded-xs flex items-center gap-2">
          <Lock size={13} />
          <span>あなただけに表示される非公開ブックマークコレクションです。</span>
        </div>
      )}

      {/* グリッド表示 */}
      {paginatedList.length > 0 ? (
        <div className="artwork-grid">
          {paginatedList.map((art) => (
            <div key={art.id} className="artwork-card group relative">
              <Link href={`/artwork/${art.id}`} className="block flex-1">
                <div className="artwork-card__image-wrap">
                  <Image
                    src={art.image_url}
                    alt={art.comment ?? '作品'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="artwork-card__fork-badge">
                    <ForkBadge permission={art.fork_permission as ForkPermission} compact />
                  </div>
                </div>

                <div className="artwork-card__body">
                  {activeTab === 'bookmarked' && (
                    <div className="artwork-card__author mb-1">
                      <User size={12} strokeWidth={1.5} />
                      {art.author?.display_name ?? '名無し'}
                    </div>
                  )}
                  {art.comment && (
                    <p className="artwork-card__comment text-xs">{art.comment}</p>
                  )}
                  <div className="text-[0.72rem] text-[var(--color-text-faint)] mt-auto pt-1">
                    {new Date(art.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </Link>

              {isMe && activeTab === 'own' && (
                <div className="p-2 border-t border-[var(--color-border-soft)] flex justify-end bg-[var(--color-surface-2)]">
                  <DeleteArtworkButton artworkId={art.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-[var(--color-text-muted)] bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs">
          {activeTab === 'own'
            ? 'まだ投稿した作品がありません。'
            : activeTab === 'forked'
            ? '誰かの作品から派生して描いた作品はまだありません。'
            : 'ブックマーク保存した作品はまだありません。'}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[var(--color-border-soft)]">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn btn--outline text-xs disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            <span>前へ</span>
          </button>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn--outline text-xs disabled:opacity-40"
          >
            <span>次へ</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
