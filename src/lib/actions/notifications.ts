'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Notification } from '@/types'

export async function getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { notifications: [], unreadCount: 0 }

  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!actor_id(id, display_name),
      artwork:artworks(id, image_url, comment)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const list = (notifications ?? []) as Notification[]
  const unreadCount = list.filter((n) => !n.is_read).length

  return { notifications: list, unreadCount }
}

export async function markNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/')
}
