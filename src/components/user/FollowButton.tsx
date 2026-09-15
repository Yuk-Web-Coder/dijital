'use client'

import { useState, useTransition } from 'react'
import { toggleFollow } from '@/lib/actions/follows'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    // 楽観的更新
    const prev = isFollowing
    setIsFollowing(!prev)

    startTransition(async () => {
      const res = await toggleFollow(targetUserId)
      if (res.error) {
        setIsFollowing(prev) // ロールバック
      } else if (res.isFollowing !== undefined) {
        setIsFollowing(res.isFollowing)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`btn btn--sm transition-all ${
        isFollowing
          ? 'btn--ghost border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-red-500/10 hover:border-red-500 hover:text-red-400'
          : 'btn--primary'
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5" />
          <span>フォロー中</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>フォロー</span>
        </>
      )}
    </button>
  )
}
