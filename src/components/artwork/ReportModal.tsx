'use client'

import { useState, useTransition } from 'react'
import { reportArtwork } from '@/lib/actions/reports'
import { Flag, Loader2, CheckCircle2 } from 'lucide-react'

interface ReportModalProps {
  artworkId: string
}

export function ReportModal({ artworkId }: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await reportArtwork(artworkId, reason)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          setReason('')
        }, 1500)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn--ghost btn--sm text-[var(--color-text-faint)] hover:text-red-400"
        title="通報する"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>通報</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadein">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <Flag className="w-5 h-5" />
              <h3>投稿の通報</h3>
            </div>

            {success ? (
              <div className="flex items-center gap-2 alert alert--success">
                <CheckCircle2 className="w-4 h-4" />
                <span>通報を受け付けました</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-[var(--color-text-muted)]">
                  不適切なコンテンツやスパムと思われる場合にご報告ください。通報が複数集まると非表示化されます。
                </p>

                <div className="form-group">
                  <label className="form-label">通報理由（任意）</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="理由を入力してください（無断転載、不適切な画像など）"
                    className="form-textarea text-xs min-h-[80px]"
                  />
                </div>

                {error && <div className="alert alert--error text-xs">{error}</div>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                    className="btn btn--ghost btn--sm"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn--danger btn--sm flex items-center gap-1.5"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>送信中...</span>
                      </>
                    ) : (
                      <span>通報を送信</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
