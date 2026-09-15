'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WebCanvasEditor } from '@/components/canvas/WebCanvasEditor'
import { PenLine, Lock } from 'lucide-react'
import type { ForkPermission } from '@/types'

interface CanvasDrawButtonProps {
  artworkId: string
  imageUrl: string
  authorName: string
  forkPermission: ForkPermission
}

export function CanvasDrawButton({
  artworkId,
  imageUrl,
  authorName,
  forkPermission,
}: CanvasDrawButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  if (forkPermission === 'LOCKED') {
    return (
      <div className="btn btn--outline opacity-50 cursor-not-allowed text-xs py-2 px-3 flex items-center gap-1.5">
        <Lock size={14} />
        <span>続きの描き足し不可 (LOCKED)</span>
      </div>
    )
  }

  const handleExportAndPost = (dataUrl: string) => {
    // 描画結果のDataURLをsessionStorageに一時保存
    try {
      sessionStorage.setItem(`canvas_fork_${artworkId}`, dataUrl)
    } catch (e) {
      console.error('Failed to store canvas data in sessionStorage:', e)
    }

    setIsOpen(false)
    router.push(`/post?fork=${artworkId}&canvas=true`)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn--blue text-xs py-2 px-4 flex items-center gap-2 font-serif font-bold shadow-xs"
      >
        <PenLine size={15} strokeWidth={1.5} />
        <span>Webキャンバスで描き足す</span>
      </button>

      {isOpen && (
        <WebCanvasEditor
          parentArtworkId={artworkId}
          parentImageUrl={imageUrl}
          parentAuthorName={authorName}
          onClose={() => setIsOpen(false)}
          onExportAndPost={handleExportAndPost}
        />
      )}
    </>
  )
}
