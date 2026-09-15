'use client'

import { useState, useTransition } from 'react'
import { addReaction } from '@/lib/actions/reactions'
import type { ReactionType } from '@/types'

const REACTION_TYPES: ReactionType[] = ['供養', '味がある', '続き描きたい', '完璧', '好き']

/** Pigment swatch color per reaction — 8px solid circle, no emoji */
const REACTION_DOT_CLASS: Record<ReactionType, string> = {
  '供養':     'reaction-dot--供養',
  '味がある': 'reaction-dot--味がある',
  '続き描きたい': 'reaction-dot--続き描きたい',
  '完璧':     'reaction-dot--完璧',
  '好き':     'reaction-dot--好き',
}

interface ReactionDisplayProps {
  artworkId?: string
  counts: { reaction_type: string; count: number }[]
  compact?: boolean
}

export function ReactionDisplay({ artworkId, counts, compact = false }: ReactionDisplayProps) {
  const [localCounts, setLocalCounts] = useState(counts)
  const [isPending, startTransition] = useTransition()

  const countMap = new Map(localCounts.map((c) => [c.reaction_type, c.count]))

  function handleReaction(type: ReactionType) {
    if (!artworkId) return
    setLocalCounts((prev) => {
      const next = new Map(prev.map((c) => [c.reaction_type, c.count]))
      next.set(type, (next.get(type) ?? 0) + 1)
      return Array.from(next.entries()).map(([reaction_type, count]) => ({ reaction_type, count }))
    })
    startTransition(async () => {
      await addReaction(artworkId, type)
    })
  }

  const displayTypes = compact
    ? REACTION_TYPES.filter((t) => (countMap.get(t) ?? 0) > 0)
    : REACTION_TYPES

  if (compact && displayTypes.length === 0) return null

  return (
    <div
      className="artwork-card__reactions"
      role="group"
      aria-label="リアクション"
    >
      {displayTypes.map((type) => {
        const count = countMap.get(type) ?? 0
        return (
          <button
            key={type}
            className={`reaction-chip${count > 0 ? ' reaction-chip--active' : ''}`}
            onClick={artworkId ? (e) => { e.preventDefault(); handleReaction(type) } : undefined}
            disabled={isPending || !artworkId}
            title={type}
            aria-label={`${type} (${count})`}
          >
            {/* 8px pigment swatch — no emoji */}
            <span
              className={`reaction-chip__dot ${REACTION_DOT_CLASS[type]}`}
              aria-hidden
            />
            {type}
            {count > 0 && (
              <span className="reaction-chip__count">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
