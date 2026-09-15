'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { sendArtworkComment, deleteArtworkComment } from '@/lib/actions/comments'
import type { ArtworkComment } from '@/types'
import { MessageSquare, Send, Trash2, Loader2, Reply, Heart } from 'lucide-react'

const ARTWORK_STAMPS = [
  '❤️ すてき！',
  '色使いが好き',
  '✍️ 線画が神',
  '👏 完成が楽しみ',
  '✨ 続き描かせて！',
  '🔥 モチベ最高',
]

interface ArtworkCommentChatProps {
  artworkId: string
  initialComments: ArtworkComment[]
  currentUserId?: string | null
}

export function ArtworkCommentChat({ artworkId, initialComments, currentUserId }: ArtworkCommentChatProps) {
  const [comments, setComments] = useState<ArtworkComment[]>(initialComments)
  const [content, setContent] = useState('')
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const handleReply = (displayName: string) => {
    setContent((prev) => `@${displayName} ${prev.replace(/^@[^\s]+\s*/, '')}`)
    inputRef.current?.focus()
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !selectedStamp) return
    setError(null)

    const stampToSend = selectedStamp
    const contentToSend = content.trim()

    const tempId = `temp-${Date.now()}`
    const tempComment: ArtworkComment = {
      id: tempId,
      artwork_id: artworkId,
      author_id: currentUserId || '',
      content: contentToSend,
      preset_stamp: stampToSend,
      created_at: new Date().toISOString(),
      author: {
        id: currentUserId || '',
        display_name: 'あなた',
        created_at: new Date().toISOString(),
      },
    }

    setComments((prev) => [...prev, tempComment])
    setContent('')
    setSelectedStamp(null)

    startTransition(async () => {
      const res = await sendArtworkComment(artworkId, contentToSend, stampToSend)
      if (res.error) {
        setError(res.error)
        setComments((prev) => prev.filter((c) => c.id !== tempId))
      } else if (res.comment) {
        setComments((prev) => prev.map((c) => (c.id === tempId ? res.comment : c)))
      }
    })
  }

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      const res = await deleteArtworkComment(commentId, artworkId)
      if (!res.error) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    })
  }

  // 本文中の @メンション をハイライト表示
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(@[^\s,.:;!?"'(){}［］「」\/\\]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-bold text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-1 rounded mr-0.5">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-soft)] rounded-2xl overflow-hidden flex flex-col h-[640px] shadow-xl">
      {/* チャットヘッダー */}
      <div className="p-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="font-bold text-sm text-[var(--color-text)]">作品チャット ＆ コメント</h3>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-3)] px-2.5 py-0.5 rounded-full font-semibold">
            {comments.length}
          </span>
        </div>
        <span className="text-xs text-[var(--color-text-faint)] flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-pink-400" />
          感想・返信欄
        </span>
      </div>

      {/* コメント一覧 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[var(--color-text-muted)] space-y-2">
            <span className="text-3xl">💬</span>
            <p className="font-medium text-[var(--color-text)]">まだコメントはありません。</p>
            <p className="text-[var(--color-text-faint)]">「すてき！」「線画が好き」などのスタンプや感想を送りましょう！</p>
          </div>
        ) : (
          comments.map((c) => {
            const isMe = currentUserId === c.author_id
            const displayName = c.author?.display_name ?? '名無し'
            return (
              <div key={c.id} className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] text-xs space-y-1.5 transition-all hover:border-[var(--color-border)]">
                <div className="flex items-center justify-between text-[0.72rem] text-[var(--color-text-muted)]">
                  <span className="font-bold text-[var(--color-text)]">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{new Date(c.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>

                    {currentUserId && !isMe && (
                      <button
                        onClick={() => handleReply(displayName)}
                        className="flex items-center gap-0.5 text-[var(--color-accent)] hover:underline"
                        title="返信"
                      >
                        <Reply className="w-3 h-3" />
                        <span>返信</span>
                      </button>
                    )}

                    {isMe && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[var(--color-text-faint)] hover:text-red-400"
                        title="削除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {c.preset_stamp && (
                  <div className="inline-block px-2 py-0.5 rounded bg-[var(--color-accent-dim)] text-[var(--color-accent)] font-bold text-[0.75rem]">
                    {c.preset_stamp}
                  </div>
                )}
                {c.content && (
                  <p className="text-[var(--color-text)] leading-relaxed whitespace-pre-wrap text-[0.82rem]">
                    {renderFormattedText(c.content)}
                  </p>
                )}
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 送信フォーム */}
      {currentUserId ? (
        <form onSubmit={handleSend} className="p-3 border-t border-[var(--color-border-soft)] bg-[var(--color-surface-2)] space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ARTWORK_STAMPS.map((stamp) => (
              <button
                key={stamp}
                type="button"
                onClick={() => setSelectedStamp(selectedStamp === stamp ? null : stamp)}
                className={`px-2.5 py-1 rounded-md text-[0.72rem] font-medium whitespace-nowrap transition-all border ${
                  selectedStamp === stamp
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                    : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)] border-[var(--color-border-soft)] hover:border-[var(--color-border)]'
                }`}
              >
                {stamp}
              </button>
            ))}
          </div>

          {error && <div className="text-[0.75rem] text-red-400">{error}</div>}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={selectedStamp ? `${selectedStamp} と一緒に送る...` : '感想や@返信を入力...'}
              maxLength={200}
              className="form-input text-xs flex-1 !py-2"
            />
            <button
              type="submit"
              disabled={isPending || (!content.trim() && !selectedStamp)}
              className="btn btn--primary btn--sm flex items-center gap-1 px-3"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>送信</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 text-center text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border-soft)] bg-[var(--color-surface-2)]">
          コメントを送信するにはログインが必要です。
        </div>
      )}
    </div>
  )
}
