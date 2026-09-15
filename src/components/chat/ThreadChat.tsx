'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { sendThreadMessage, deleteThreadMessage } from '@/lib/actions/chat'
import type { ThreadMessage } from '@/types'
import { MessageSquare, Send, Trash2, Loader2, Smile, Reply } from 'lucide-react'

const PRESET_STAMPS = [
  '制作おつかれさま！',
  'ここすき！',
  '続き描きたい！',
  'アドバイス歓迎',
  'ちょっと一息',
  'モチベUP！',
]

interface ThreadChatProps {
  threadId: string
  initialMessages: ThreadMessage[]
  currentUserId?: string | null
}

export function ThreadChat({ threadId, initialMessages, currentUserId }: ThreadChatProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages)
  const [content, setContent] = useState('')
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

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
    const tempMessage: ThreadMessage = {
      id: tempId,
      thread_id: threadId,
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

    setMessages((prev) => [...prev, tempMessage])
    setContent('')
    setSelectedStamp(null)

    startTransition(async () => {
      const res = await sendThreadMessage(threadId, contentToSend, stampToSend)
      if (res.error) {
        setError(res.error)
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      } else if (res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)))
      }
    })
  }

  const handleDelete = (messageId: string) => {
    startTransition(async () => {
      const res = await deleteThreadMessage(messageId, threadId)
      if (!res.error) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    })
  }

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(@[^\s,.:;!?"'(){}［］「」\/\\]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-bold text-[var(--pigment-blue)] underline underline-offset-2 mr-0.5">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs overflow-hidden flex flex-col min-h-[380px] max-h-[70vh] h-[520px] shadow-xs">
      {/* チャットヘッダー */}
      <div className="p-3 border-b border-[var(--color-border-soft)] bg-[var(--bg-gesso)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--pigment-blue)]" />
          <h3 className="font-bold text-xs font-serif text-[var(--ink-primary)]">スレッドチャット</h3>
          <span className="text-[0.7rem] font-mono text-[var(--color-text-muted)] bg-[var(--surface-paper)] px-2 py-0.5 border border-[var(--color-border-soft)] rounded-xs">
            {messages.length} 件
          </span>
        </div>
        <span className="text-[0.7rem] text-[var(--ink-muted)] flex items-center gap-1">
          <Smile className="w-3.5 h-3.5 text-[var(--pigment-blue)]" />
          応援・交流エリア
        </span>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[var(--color-text-muted)] space-y-2">
            <MessageSquare size={32} strokeWidth={1.2} className="text-[var(--ink-muted)]" />
            <p>まだチャットメッセージはありません。</p>
            <p className="text-[var(--color-text-faint)]">「制作おつかれさま！」スタンプなどを気軽に送ってみましょう！</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = currentUserId === m.author_id
            const displayName = m.author?.display_name ?? '名無し'
            return (
              <div
                key={m.id}
                className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 text-[0.72rem] text-[var(--color-text-muted)]">
                  <span className="font-semibold text-[var(--ink-primary)]">
                    {displayName}
                  </span>
                  <span>{new Date(m.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>

                  {currentUserId && !isMe && (
                    <button
                      onClick={() => handleReply(displayName)}
                      className="text-[var(--pigment-blue)] hover:underline flex items-center gap-0.5"
                      title="返信"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                  )}

                  {isMe && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-[var(--color-text-faint)] hover:text-[var(--pigment-red)] transition-colors"
                      title="メッセージを削除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div
                  className={`p-2.5 rounded-xs max-w-[88%] text-xs space-y-1 ${
                    isMe
                      ? 'bg-[var(--pigment-blue)] text-white'
                      : 'bg-[var(--bg-gesso)] border border-[var(--color-border-soft)] text-[var(--ink-primary)]'
                  }`}
                >
                  {m.preset_stamp && (
                    <div className="inline-block px-2 py-0.5 rounded-xs bg-black/15 font-bold text-[0.75rem] mb-1">
                      {m.preset_stamp}
                    </div>
                  )}
                  {m.content && <p className="leading-relaxed whitespace-pre-wrap">{renderFormattedText(m.content)}</p>}
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 入力フォーム */}
      {currentUserId ? (
        <form onSubmit={handleSend} className="p-3 border-t border-[var(--color-border-soft)] bg-[var(--bg-gesso)] space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_STAMPS.map((stamp) => (
              <button
                key={stamp}
                type="button"
                onClick={() => setSelectedStamp(selectedStamp === stamp ? null : stamp)}
                className={`px-2 py-1 rounded-xs text-[0.72rem] font-medium whitespace-nowrap transition-all border ${
                  selectedStamp === stamp
                    ? 'bg-[var(--pigment-blue)] text-white border-[var(--pigment-blue)]'
                    : 'bg-[var(--surface-paper)] text-[var(--ink-primary)] border-[var(--color-border-soft)] hover:border-[var(--ink-primary)]'
                }`}
              >
                {stamp}
              </button>
            ))}
          </div>

          {error && <div className="text-[0.75rem] text-[var(--pigment-red)]">{error}</div>}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={selectedStamp ? `${selectedStamp} と一緒に送る...` : 'メッセージや@返信を入力...'}
              maxLength={200}
              className="form-input text-xs flex-1 !py-1.5"
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
        <div className="p-3 border-t border-[var(--color-border-soft)] bg-[var(--bg-gesso)] text-center text-xs text-[var(--color-text-muted)]">
          チャットに参加するにはログインが必要です。
        </div>
      )}
    </div>
  )
}
