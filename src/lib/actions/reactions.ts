'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReactionType } from '@/types'
import { revalidatePath } from 'next/cache'

const ALLOWED_REACTIONS: ReactionType[] = ['供養', '味がある', '続き描きたい', '完璧', '好き']

export async function addReaction(artworkId: string, reactionType: ReactionType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 認証チェック
  if (!user) {
    return { error: 'リアクションするにはログインが必要です' }
  }

  // reaction_type の許可リスト検証
  if (!ALLOWED_REACTIONS.includes(reactionType)) {
    return { error: '無効なリアクションタイプです' }
  }

  const { error } = await supabase.from('reactions').insert({
    artwork_id: artworkId,
    author_id: user.id,
    reaction_type: reactionType,
  })

  if (error) {
    // UNIQUE 制約違反 (重複リアクション) は正常扱い
    if (error.code === '23505') {
      return { success: true, duplicate: true }
    }
    console.error('Failed to add reaction:', error)
    return { error: 'リアクションの送信に失敗しました' }
  }

  revalidatePath(`/artwork/${artworkId}`)
  return { success: true }
}
