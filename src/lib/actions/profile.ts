'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DISPLAY_NAME_MAX_LEN = 30
const BIO_MAX_LEN = 300
const AVATAR_URL_MAX_LEN = 512

export async function updateProfile({
  displayName,
  bio,
  avatarUrl,
}: {
  displayName: string
  bio?: string
  avatarUrl?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'ログインが必要です' }
  }

  // ─── 入力バリデーション ──────────────────────────────────────
  const trimmedName = displayName.trim()
  if (!trimmedName) {
    return { error: '表示名を入力してください' }
  }
  if (trimmedName.length > DISPLAY_NAME_MAX_LEN) {
    return { error: `表示名は${DISPLAY_NAME_MAX_LEN}文字以内で入力してください` }
  }

  const trimmedBio = bio?.trim()
  if (trimmedBio && trimmedBio.length > BIO_MAX_LEN) {
    return { error: `自己紹介は${BIO_MAX_LEN}文字以内で入力してください` }
  }

  const trimmedAvatarUrl = avatarUrl?.trim()
  if (trimmedAvatarUrl && trimmedAvatarUrl.length > AVATAR_URL_MAX_LEN) {
    return { error: 'アバター URL が長すぎます' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    display_name: trimmedName || '名無し',
  }

  if (bio !== undefined) updates.bio = trimmedBio ?? null
  if (avatarUrl !== undefined) updates.avatar_url = trimmedAvatarUrl ?? null

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return { error: 'プロフィールの更新に失敗しました: ' + error.message }
  }

  revalidatePath(`/atelier/${user.id}`)
  revalidatePath('/atelier/me')
  return { success: true }
}
