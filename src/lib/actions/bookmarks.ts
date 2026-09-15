'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Artwork } from '@/types'

export async function toggleBookmark(artworkId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '保存するにはログインが必要です' }
  }

  // 既に保存済みかチェック
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('artwork_id', artworkId)
    .single()

  if (existing) {
    // 解除
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId)

    if (error) return { error: '保存の解除に失敗しました' }
    revalidatePath(`/artwork/${artworkId}`)
    revalidatePath('/atelier/me')
    return { isBookmarked: false }
  } else {
    // 追加
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        artwork_id: artworkId,
      })

    if (error) return { error: '保存に失敗しました' }
    revalidatePath(`/artwork/${artworkId}`)
    revalidatePath('/atelier/me')
    return { isBookmarked: true }
  }
}

export async function getBookmarkStatus(artworkId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('artwork_id', artworkId)
    .single()

  return !!existing
}

export async function getUserBookmarks(): Promise<Artwork[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      artwork:artworks (
        *,
        author:profiles!author_id(id, display_name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!bookmarks) return []

  return bookmarks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.artwork)
    .filter((a): a is Artwork => a !== null && !a.is_blinded)
}
