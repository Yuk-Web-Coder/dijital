'use client'

import { useState, useTransition } from 'react'
import { createThread } from '@/lib/actions/threads'
import { PlusCircle, Loader2, X } from 'lucide-react'

const CATEGORIES = [
  '雑談',
  'アドバイス・添削求む',
  'コラボ・続き募集',
  '練習',
  '落書き供養',
  '塗り絵',
  '背景練習',
  '5分落書き',
  'WIP',
  'その他',
]

export function CreateThreadModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createThread(formData)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn--primary btn--sm flex items-center gap-1.5"
      >
        <PlusCircle className="w-4 h-4" />
        <span>スレッドを立てる</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadein">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                新しいスレッドを立てる
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              テーマや練習目的に合わせたスレッドを作成して、自由に作品を募ったり雑談しましょう。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="form-group">
                <label className="form-label" htmlFor="thread-title">
                  スレッドタイトル <span className="text-red-400">*</span>
                </label>
                <input
                  id="thread-title"
                  name="title"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="例: 手の描き方練習＆アドバイススレ"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="thread-category">
                  カテゴリ <span className="text-red-400">*</span>
                </label>
                <select
                  id="thread-category"
                  name="category_type"
                  required
                  defaultValue="雑談"
                  className="form-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="thread-desc">
                  スレッドの説明（任意）
                </label>
                <textarea
                  id="thread-desc"
                  name="description"
                  maxLength={300}
                  placeholder="このスレッドの目的や投稿ルールなどを自由に書いてください"
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
                  className="btn btn--primary btn--sm flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>作成中...</span>
                    </>
                  ) : (
                    <span>スレッドを作成</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
