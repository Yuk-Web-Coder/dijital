'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const REASON_MAX_LEN = 500

export async function reportArtwork(artworkId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '通報するにはログインが必要です' }
  }

  const trimmedReason = reason?.trim()
  if (trimmedReason && trimmedReason.length > REASON_MAX_LEN) {
    return { error: `通報理由は${REASON_MAX_LEN}文字以内で入力してください` }
  }

  // 二重通報チェック
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('artwork_id', artworkId)
    .eq('reporter_id', user.id)
    .single()

  if (existing) {
    return { error: 'この投稿は既に通報済みです' }
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      artwork_id: artworkId,
      reporter_id: user.id,
      reason: trimmedReason || '不適切なコンテンツ',
    })

  if (error) {
    console.error('Report error:', error)
    return { error: '通報の送信に失敗しました' }
  }

  revalidatePath(`/artwork/${artworkId}`)
  return { success: true }
}
