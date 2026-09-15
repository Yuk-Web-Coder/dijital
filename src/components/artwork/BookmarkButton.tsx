'use client'

import { useState, useTransition } from 'react'
import { toggleBookmark } from '@/lib/actions/bookmarks'
import { Bookmark, Loader2 } from 'lucide-react'

interface BookmarkButtonProps {
  artworkId: string
  initialIsBookmarked: boolean
}

export function BookmarkButton({ artworkId, initialIsBookmarked }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    const prev = isBookmarked
    setIsBookmarked(!prev)

    startTransition(async () => {
      const res = await toggleBookmark(artworkId)
      if (res.error) {
        setIsBookmarked(prev)
      } else if (res.isBookmarked !== undefined) {
        setIsBookmarked(res.isBookmarked)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`btn btn--sm transition-all ${
        isBookmarked
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
          : 'btn--ghost hover:text-amber-400'
      }`}
      title={isBookmarked ? 'お気に入りから解除' : '非公開でお気に入りに保存'}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
      )}
      <span>{isBookmarked ? '保存済み' : '非公開で保存'}</span>
    </button>
  )
}
