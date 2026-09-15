'use client'

import { useState, useTransition } from 'react'
import { deleteArtwork } from '@/lib/actions/artworks'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteArtworkButtonProps {
  artworkId: string
}

export function DeleteArtworkButton({ artworkId }: DeleteArtworkButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteArtwork(artworkId)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn--danger btn--sm"
        title="投稿を削除"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>削除</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadein">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              投稿を削除しますか？
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              この操作は取り消せません。画像および派生関係・リアクションも削除されます。
            </p>

            {error && (
              <div className="alert alert--error text-xs">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="btn btn--ghost btn--sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="btn btn--danger btn--sm flex items-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>削除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>削除する</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
