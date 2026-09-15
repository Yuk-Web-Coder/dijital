'use server'

import { createClient } from '@/lib/supabase/server'

export type ContactState = {
  success?: boolean
  error?: string
}

export async function submitInquiry(prevState: ContactState | null, formData: FormData): Promise<ContactState> {
  const name = (formData.get('name') as string || '').trim()
  const email = (formData.get('email') as string || '').trim()
  const category = (formData.get('category') as string || '').trim()
  const message = (formData.get('message') as string || '').trim()

  if (!name || name.length > 50) {
    return { error: 'お名前は1〜50文字で入力してください。' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email) || email.length > 255) {
    return { error: '有効なメールアドレスを入力してください。' }
  }

  const validCategories = ['general', 'bug', 'copyright', 'other']
  if (!category || !validCategories.includes(category)) {
    return { error: '有効なお問い合わせ種別を選択してください。' }
  }

  if (!message || message.length < 10 || message.length > 2000) {
    return { error: 'お問い合わせ内容は10文字以上2000文字以内で入力してください。' }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: dbError } = await supabase
      .from('inquiries')
      .insert({
        name,
        email,
        category,
        message,
        user_id: user?.id || null,
      })

    if (dbError) {
      console.error('Inquiry submission DB error:', dbError)
      return { error: '送信中にエラーが発生しました。時間を置いて再度お試しください。' }
    }

    return { success: true }
  } catch (err) {
    console.error('Inquiry submission catch error:', err)
    return { error: '送信中に問題が発生しました。' }
  }
}
