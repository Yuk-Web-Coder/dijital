'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const TITLE_MAX_LEN = 50
const DESCRIPTION_MAX_LEN = 500

export async function createThread(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'スレッドを立てるにはログインが必要です' }
  }

  const title = (formData.get('title') as string)?.trim()
  const categoryType = (formData.get('category_type') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()

  if (!title || !categoryType) {
    return { error: 'タイトルとカテゴリは必須です' }
  }

  if (title.length > TITLE_MAX_LEN) {
    return { error: `タイトルは${TITLE_MAX_LEN}文字以内で入力してください` }
  }

  if (description && description.length > DESCRIPTION_MAX_LEN) {
    return { error: `説明は${DESCRIPTION_MAX_LEN}文字以内で入力してください` }
  }

  const { data: newThread, error } = await supabase
    .from('threads')
    .insert({
      title,
      category_type: categoryType,
      description: description || null,
      author_id: user.id,
    })
    .select('id')
    .single()

  if (error || !newThread) {
    console.error('Create thread error:', error)
    return { error: 'スレッドの作成に失敗しました' }
  }

  revalidatePath('/threads')
  revalidatePath('/')
  redirect(`/threads/${newThread.id}`)
}

export async function updateThread(threadId: string, formData: { title: string; category_type: string; description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '権限がありません' }

  // 所有者チェック
  const { data: thread } = await supabase
    .from('threads')
    .select('author_id')
    .eq('id', threadId)
    .single()

  if (!thread) return { error: 'スレッドが見つかりません' }
  if (thread.author_id !== user.id) return { error: 'このスレッドを編集する権限がありません' }

  const title = formData.title.trim()
  if (!title) return { error: 'タイトルは必須です' }
  if (title.length > TITLE_MAX_LEN) return { error: `タイトルは${TITLE_MAX_LEN}文字以内で入力してください` }

  const description = formData.description?.trim()
  if (description && description.length > DESCRIPTION_MAX_LEN) {
    return { error: `説明は${DESCRIPTION_MAX_LEN}文字以内で入力してください` }
  }

  const { error } = await supabase
    .from('threads')
    .update({
      title,
      category_type: formData.category_type,
      description: description || null,
    })
    .eq('id', threadId)
    .eq('author_id', user.id)  // 二重チェック

  if (error) return { error: 'スレッドの更新に失敗しました' }

  revalidatePath('/threads')
  revalidatePath(`/threads/${threadId}`)
  return { success: true }
}

export async function deleteThread(threadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '権限がありません' }

  // 所有者チェック
  const { data: thread } = await supabase
    .from('threads')
    .select('author_id')
    .eq('id', threadId)
    .single()

  if (!thread) return { error: 'スレッドが見つかりません' }
  if (thread.author_id !== user.id) return { error: 'このスレッドを削除する権限がありません' }

  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId)
    .eq('author_id', user.id)  // 二重チェック

  if (error) return { error: 'スレッドの削除に失敗しました' }

  revalidatePath('/threads')
  revalidatePath('/')
  redirect('/threads')
}

export async function togglePinThread(threadId: string, isPinned: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '権限がありません' }

  // 所有者チェック
  const { data: thread } = await supabase
    .from('threads')
    .select('author_id')
    .eq('id', threadId)
    .single()

  if (!thread) return { error: 'スレッドが見つかりません' }
  if (thread.author_id !== user.id) return { error: 'このスレッドを操作する権限がありません' }

  const { error } = await supabase
    .from('threads')
    .update({ is_pinned: !isPinned })
    .eq('id', threadId)
    .eq('author_id', user.id)  // 二重チェック

  if (error) return { error: 'ピン留めの更新に失敗しました' }

  revalidatePath('/threads')
  revalidatePath('/')
  return { isPinned: !isPinned }
}
