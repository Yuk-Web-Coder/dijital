'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { LogIn, LogOut, Palette } from 'lucide-react'

interface AuthButtonProps {
  user: User | null
}

export function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="btn btn--primary btn--sm">
        <LogIn size={13} strokeWidth={1.5} />
        ログイン
      </Link>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <Link href="/atelier/me" className="btn btn--ghost btn--sm">
        <Palette size={13} strokeWidth={1.5} />
        アトリエ
      </Link>
      <button
        onClick={handleSignOut}
        className="btn btn--ghost btn--sm"
        title="ログアウト"
        aria-label="ログアウト"
      >
        <LogOut size={13} strokeWidth={1.5} />
      </button>
    </div>
  )
}

