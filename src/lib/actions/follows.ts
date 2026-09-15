'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'フォローするにはログインが必要です' }
  }

  if (user.id === targetUserId) {
    return { error: '自分自身をフォローすることはできません' }
  }

  // 現在のフォロー状態チェック
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single()

  if (existing) {
    // フォロー解除
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (error) return { error: 'フォローの解除に失敗しました' }
    revalidatePath(`/atelier/${targetUserId}`)
    revalidatePath('/')
    return { isFollowing: false }
  } else {
    // フォロー登録
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
      })

    if (error) return { error: 'フォローの登録に失敗しました' }

    // 通知作成
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: user.id,
      type: 'FOLLOW',
    })

    revalidatePath(`/atelier/${targetUserId}`)
    revalidatePath('/')
    return { isFollowing: true }
  }
}

export async function getFollowStatus(targetUserId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // フォロワー数
  const { count: followersCount } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', targetUserId)

  // フォロー中数
  const { count: followingCount } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', targetUserId)

  let isFollowing = false
  if (user) {
    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single()
    isFollowing = !!existing
  }

  return {
    isFollowing,
    followersCount: followersCount ?? 0,
    followingCount: followingCount ?? 0,
  }
}
