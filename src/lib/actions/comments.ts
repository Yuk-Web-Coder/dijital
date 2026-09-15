'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ArtworkComment } from '@/types'

const CONTENT_MAX_LEN = 1000

export async function getArtworkComments(artworkId: string): Promise<ArtworkComment[]> {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('artwork_comments')
    .select(`
      *,
      author:profiles!author_id(id, display_name)
    `)
    .eq('artwork_id', artworkId)
    .order('created_at', { ascending: true })
    .limit(100)

  return (comments ?? []) as ArtworkComment[]
}

export async function sendArtworkComment(
  artworkId: string,
  content: string,
  presetStamp?: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'コメントするにはログインが必要です' }
  }

  const trimmed = content?.trim()
  if (!trimmed && !presetStamp) {
    return { error: 'コメントまたはスタンプを入力してください' }
  }

  if (trimmed && trimmed.length > CONTENT_MAX_LEN) {
    return { error: `コメントは${CONTENT_MAX_LEN}文字以内で入力してください` }
  }

  // 対象作品情報の取得 (通知作成用)
  const { data: artwork } = await supabase
    .from('artworks')
    .select('author_id')
    .eq('id', artworkId)
    .single()

  const { data: newComment, error } = await supabase
    .from('artwork_comments')
    .insert({
      artwork_id: artworkId,
      author_id: user.id,
      content: trimmed || '',
      preset_stamp: presetStamp || null,
    })
    .select(`
      *,
      author:profiles!author_id(id, display_name)
    `)
    .single()

  if (error || !newComment) {
    console.error('Send comment error:', error)
    return { error: 'コメントの送信に失敗しました' }
  }

  // 作者が自分でない場合、COMMENT通知を作成
  if (artwork && artwork.author_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: artwork.author_id,
      actor_id: user.id,
      type: 'COMMENT',
      artwork_id: artworkId,
    })
  }

  // @メンション解析・通知生成
  const mentions = trimmed?.match(/@([^\s,.:;!?"'(){}［］「」\/\\]+)/g)
  if (mentions && mentions.length > 0) {
    const names = Array.from(new Set(mentions.map((m) => m.slice(1)))).slice(0, 5)
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('display_name', names)

    if (mentionedUsers && mentionedUsers.length > 0) {
      for (const targetUser of mentionedUsers) {
        await supabase.from('notifications').insert({
          user_id: targetUser.id,
          actor_id: user.id,
          type: 'MENTION',
          artwork_id: artworkId,
        })
      }
    }
  }

  revalidatePath(`/artwork/${artworkId}`)
  return { comment: newComment as ArtworkComment }
}

export async function deleteArtworkComment(commentId: string, artworkId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'ログインが必要です' }
  }

  const { error } = await supabase
    .from('artwork_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) {
    console.error('Delete comment error:', error)
    return { error: 'コメントの削除に失敗しました' }
  }

  revalidatePath(`/artwork/${artworkId}`)
  return { success: true }
}
