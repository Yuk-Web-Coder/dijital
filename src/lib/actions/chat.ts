'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ThreadMessage } from '@/types'

const CONTENT_MAX_LEN = 500

export async function getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from('thread_messages')
    .select(`
      *,
      author:profiles!author_id(id, display_name)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(100)

  return (messages ?? []) as ThreadMessage[]
}

export async function sendThreadMessage(
  threadId: string,
  content: string,
  presetStamp?: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'メッセージを送信するにはログインが必要です' }
  }

  const trimmedContent = content?.trim()
  if (!trimmedContent && !presetStamp) {
    return { error: 'メッセージまたはスタンプを入力してください' }
  }

  if (trimmedContent && trimmedContent.length > CONTENT_MAX_LEN) {
    return { error: `メッセージは${CONTENT_MAX_LEN}文字以内で入力してください` }
  }

  const { data: newMessage, error } = await supabase
    .from('thread_messages')
    .insert({
      thread_id: threadId,
      author_id: user.id,
      content: trimmedContent || '',
      preset_stamp: presetStamp || null,
    })
    .select(`
      *,
      author:profiles!author_id(id, display_name)
    `)
    .single()

  if (error || !newMessage) {
    console.error('Send chat error:', error)
    return { error: 'メッセージの送信に失敗しました' }
  }

  // @メンションの解析と MENTION 通知生成 (上限5件)
  const mentions = trimmedContent?.match(/@([^\s,.:;!?"'(){}［］「」\/\\]+)/g)
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
        })
      }
    }
  }

  revalidatePath(`/threads/${threadId}`)
  return { message: newMessage as ThreadMessage }
}

export async function deleteThreadMessage(messageId: string, threadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'ログインが必要です' }
  }

  const { error } = await supabase
    .from('thread_messages')
    .delete()
    .eq('id', messageId)
    .eq('author_id', user.id)

  if (error) {
    console.error('Delete chat error:', error)
    return { error: 'メッセージの削除に失敗しました' }
  }

  revalidatePath(`/threads/${threadId}`)
  return { success: true }
}
