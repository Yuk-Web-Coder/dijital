'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { markNotificationsAsRead } from '@/lib/actions/notifications'
import type { Notification } from '@/types'
import { Bell, GitFork, MessageSquare, UserPlus, AtSign } from 'lucide-react'

interface NotificationDropdownProps {
  initialNotifications: Notification[]
  initialUnreadCount: number
}

export function NotificationDropdown({ initialNotifications, initialUnreadCount }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [, startTransition] = useTransition()

  const handleOpen = () => {
    const nextState = !isOpen
    setIsOpen(nextState)

    if (nextState && unreadCount > 0) {
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      startTransition(async () => {
        await markNotificationsAsRead()
      })
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="btn btn--ghost btn--sm relative p-2"
        title="通知"
      >
        <Bell className="w-4 h-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--pigment-red)] text-white text-[0.62rem] font-mono font-bold w-4 h-4 rounded-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs shadow-md z-50 overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-[var(--color-border-soft)] flex items-center justify-between bg-[var(--bg-gesso)]">
            <h4 className="font-serif font-bold text-xs text-[var(--ink-primary)] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[var(--pigment-blue)]" />
              <span>お知らせ・通知</span>
            </h4>
            <span className="text-[0.68rem] font-mono text-[var(--color-text-muted)]">最新30件</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border-soft)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-muted)]">
                通知はまだありません。
              </div>
            ) : (
              notifications.map((n) => {
                const actorName = n.actor?.display_name ?? '誰か'
                let icon = <Bell className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                let text = ''
                let href = '#'

                if (n.type === 'FORK') {
                  icon = <GitFork className="w-3.5 h-3.5 text-[var(--pigment-blue)]" />
                  text = `${actorName}さんがあなたの作品の続きを描きました！`
                  href = n.artwork_id ? `/artwork/${n.artwork_id}` : '#'
                } else if (n.type === 'COMMENT') {
                  icon = <MessageSquare className="w-3.5 h-3.5 text-[var(--pigment-blue)]" />
                  text = `${actorName}さんが作品にコメントしました`
                  href = n.artwork_id ? `/artwork/${n.artwork_id}` : '#'
                } else if (n.type === 'FOLLOW') {
                  icon = <UserPlus className="w-3.5 h-3.5 text-[var(--pigment-red)]" />
                  text = `${actorName}さんにフォローされました`
                  href = `/atelier/${n.actor_id}`
                } else if (n.type === 'MENTION') {
                  icon = <AtSign className="w-3.5 h-3.5 text-[var(--pigment-blue)]" />
                  text = `${actorName}さんがあなたをメンションしました`
                  href = n.artwork_id ? `/artwork/${n.artwork_id}` : '#'
                }

                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 hover:bg-[var(--bg-gesso)] transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-xs bg-[var(--bg-gesso)] border border-[var(--color-border-soft)]">{icon}</div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-[var(--ink-primary)] font-medium leading-tight">{text}</p>
                        <p className="text-[0.68rem] font-mono text-[var(--color-text-faint)]">
                          {new Date(n.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
