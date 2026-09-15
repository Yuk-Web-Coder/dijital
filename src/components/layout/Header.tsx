import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuthButton } from '@/components/auth/AuthButton'
import { NotificationDropdown } from '@/components/notification/NotificationDropdown'
import { getNotifications } from '@/lib/actions/notifications'
import { PenLine } from 'lucide-react'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { notifications, unreadCount } = user
    ? await getNotifications()
    : { notifications: [], unreadCount: 0 }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-logo">
          <span className="site-logo__mark" aria-hidden>
            <PenLine size={14} strokeWidth={1.5} />
          </span>
          デジタルアトリエ
        </Link>

        <nav className="header-nav" aria-label="メインナビゲーション">
          <Link href="/threads" className="btn btn--ghost btn--sm">
            掲示板
          </Link>
          <Link href="/search" className="btn btn--ghost btn--sm">
            作品検索
          </Link>

          {user && (
            <>
              <NotificationDropdown
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
              />
              <Link href="/atelier/me" className="btn btn--ghost btn--sm">
                マイアトリエ
              </Link>
              <Link href="/post" className="btn btn--blue btn--sm">
                <PenLine size={13} strokeWidth={1.5} />
                投稿
              </Link>
            </>
          )}

          <AuthButton user={user} />
        </nav>
      </div>
    </header>
  )
}

