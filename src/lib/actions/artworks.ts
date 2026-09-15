'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ForkPermission } from '@/types'
import sharp from 'sharp'

// 投稿レートリミット: 1日5件
const DAILY_LIMIT = 5

// 許可する画像 MIME タイプ
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// コメント最大文字数
const COMMENT_MAX_LEN = 1000

// タグ設定
const TAG_MAX_LEN = 20
const TAG_MAX_COUNT = 10

export async function createArtwork(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'ログインが必要です' }
  }

  // レートリミットチェック
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('artworks')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .gte('created_at', today.toISOString())

  if ((count ?? 0) >= DAILY_LIMIT) {
    return { error: `1日の投稿上限（${DAILY_LIMIT}件）に達しています。明日また投稿してください。` }
  }

  const threadId = formData.get('thread_id') as string
  const comment = (formData.get('comment') as string) || ''
  const forkPermission = formData.get('fork_permission') as ForkPermission
  const parentArtworkId = formData.get('parent_artwork_id') as string | null
  const imageFile = formData.get('image') as File | null
  const tagsJson = formData.get('tags_json') as string | null

  // ─── 入力バリデーション ───────────────────────────────────────
  if (!threadId || !forkPermission || !imageFile || imageFile.size === 0) {
    return { error: '必須項目が不足しています' }
  }

  if (comment.length > COMMENT_MAX_LEN) {
    return { error: `説明は${COMMENT_MAX_LEN}文字以内で入力してください` }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    return { error: '対応していないファイル形式です (JPEG / PNG / WebP / GIF のみ)' }
  }

  if (!['ANY', 'COLOR_ONLY', 'BACKGROUND_ONLY', 'LOCKED'].includes(forkPermission)) {
    return { error: '無効なフォーク設定です' }
  }

  // タグの安全なパース
  let tags: string[] = []
  try {
    const parsed = JSON.parse(tagsJson ?? '[]')
    if (Array.isArray(parsed)) {
      tags = parsed
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && t.length <= TAG_MAX_LEN)
        .slice(0, TAG_MAX_COUNT)
    }
  } catch {
    // 不正 JSON は無視して空配列
  }

  const progressFiles = formData.getAll('progress_images') as File[]

  // ─── フォーク元の fork_permission をサーバー側で検証 ──────────
  if (parentArtworkId) {
    const { data: parentArt } = await supabase
      .from('artworks')
      .select('fork_permission')
      .eq('id', parentArtworkId)
      .single()

    if (!parentArt) {
      return { error: '指定された派生元作品が見つかりません' }
    }
    if (parentArt.fork_permission === 'LOCKED') {
      return { error: 'この作品はフォーク（続き描き）が許可されていません' }
    }
  }

  // 主画像処理: リサイズ + WebP変換
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
  let processedBuffer: Buffer

  try {
    const metadata = await sharp(imageBuffer).metadata()
    const longEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0)
    const targetSize = Math.min(longEdge, 1400)

    processedBuffer = await sharp(imageBuffer)
      .resize({
        width: metadata.width! >= metadata.height! ? targetSize : undefined,
        height: metadata.height! > metadata.width! ? targetSize : undefined,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: 85 })
      .toBuffer()
  } catch {
    return { error: '画像の処理に失敗しました。別のファイルを試してください。' }
  }

  // Supabase Storage に主画像をアップロード
  const fileName = `${user.id}/${Date.now()}.webp`
  const { error: uploadError } = await supabase.storage
    .from('artworks')
    .upload(fileName, processedBuffer, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: '画像のアップロードに失敗しました' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('artworks')
    .getPublicUrl(fileName)

  // WIP 過程画像の処理 & アップロード (最大4枚)
  const progressUrls: string[] = []
  for (let i = 0; i < Math.min(progressFiles.length, 4); i++) {
    const pFile = progressFiles[i]
    if (pFile && pFile.size > 0 && ALLOWED_IMAGE_TYPES.includes(pFile.type)) {
      try {
        const pBuffer = Buffer.from(await pFile.arrayBuffer())
        const pMeta = await sharp(pBuffer).metadata()
        const pLongEdge = Math.max(pMeta.width ?? 0, pMeta.height ?? 0)
        const pTargetSize = Math.min(pLongEdge, 1400)

        const pProcessed = await sharp(pBuffer)
          .resize({
            width: pMeta.width! >= pMeta.height! ? pTargetSize : undefined,
            height: pMeta.height! > pMeta.width! ? pTargetSize : undefined,
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: 80 })
          .toBuffer()

        const pFileName = `${user.id}/${Date.now()}_wip_${i}.webp`
        const { error: pUploadErr } = await supabase.storage
          .from('artworks')
          .upload(pFileName, pProcessed, { contentType: 'image/webp' })

        if (!pUploadErr) {
          const { data: { publicUrl: pUrl } } = supabase.storage.from('artworks').getPublicUrl(pFileName)
          progressUrls.push(pUrl)
        }
      } catch (e) {
        console.error('Progress image upload error:', e)
      }
    }
  }

  // artworks テーブルに挿入
  let { data: newArtwork, error: insertError } = await supabase
    .from('artworks')
    .insert({
      thread_id: threadId,
      author_id: user.id,
      image_url: publicUrl,
      comment: comment || null,
      fork_permission: forkPermission,
      parent_artwork_id: parentArtworkId || null,
      tags: tags,
      progress_images: progressUrls,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Insert error (retrying with base columns):', insertError)
    // フォールバック: 新規追加カラムを除外して基本フィールドのみで再試行
    const retryRes = await supabase
      .from('artworks')
      .insert({
        thread_id: threadId,
        author_id: user.id,
        image_url: publicUrl,
        comment: comment || null,
        fork_permission: forkPermission,
        parent_artwork_id: parentArtworkId || null,
      })
      .select('id')
      .single()

    newArtwork = retryRes.data
    insertError = retryRes.error
  }

  if (insertError || !newArtwork) {
    console.error('Final insert error:', insertError)
    return { error: '投稿の保存に失敗しました' }
  }

  // フォーク投稿の場合は親作者へ FORK 通知を作成
  if (parentArtworkId) {
    const { data: parentArt } = await supabase
      .from('artworks')
      .select('author_id')
      .eq('id', parentArtworkId)
      .single()

    if (parentArt && parentArt.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: parentArt.author_id,
        actor_id: user.id,
        type: 'FORK',
        artwork_id: newArtwork.id,
      })
    }
  }

  revalidatePath(`/threads/${threadId}`)
  redirect(`/artwork/${newArtwork.id}`)
}

export async function deleteArtwork(artworkId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'ログインが必要です' }
  }

  // 作品情報および投稿者の確認
  const { data: artwork, error: fetchError } = await supabase
    .from('artworks')
    .select('id, author_id, thread_id, image_url')
    .eq('id', artworkId)
    .single()

  if (fetchError || !artwork) {
    return { error: '対象の作品が見つかりません' }
  }

  if (artwork.author_id !== user.id) {
    return { error: '自分の投稿のみ削除できます' }
  }

  // Storage から画像の削除を試みる
  try {
    const urlObj = new URL(artwork.image_url)
    const pathSegments = urlObj.pathname.split('/artworks/')
    if (pathSegments.length > 1) {
      const storagePath = decodeURIComponent(pathSegments[1])
      await supabase.storage.from('artworks').remove([storagePath])
    }
  } catch (e) {
    console.error('Storage remove error:', e)
  }

  // DBから削除 (artwork_lineage や reactions は ON DELETE CASCADE)
  const { error: deleteError } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error: '投稿の削除に失敗しました' }
  }

  revalidatePath(`/threads/${artwork.thread_id}`)
  revalidatePath('/')
  redirect(`/threads/${artwork.thread_id}`)
}
