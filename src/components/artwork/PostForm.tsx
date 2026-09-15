'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { createArtwork } from '@/lib/actions/artworks'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import type { ForkPermission, Thread } from '@/types'
import { Upload, ImageIcon, Layers, Tag as TagIcon } from 'lucide-react'

const FORK_PERMISSIONS: { value: ForkPermission; label: string; desc: string }[] = [
  { value: 'ANY', label: '派生自由', desc: '誰でも改変・続き描き可' },
  { value: 'COLOR_ONLY', label: '着彩のみ', desc: '線画への着彩のみ許可' },
  { value: 'BACKGROUND_ONLY', label: '背景追加のみ', desc: 'キャラへの背景追加のみ' },
  { value: 'LOCKED', label: '閲覧のみ', desc: '派生・描き足し不可' },
]

const POPULAR_TAGS = ['ポーズ練習', '線画求む', '練習', '手癖', 'ワンドロ', '色塗り練習']

interface ParentArtwork {
  id: string
  image_url: string
  comment: string | null
  fork_permission: string
  author: { display_name: string }
}

interface PostFormProps {
  threads: Thread[]
  defaultThreadId?: string
  parentArtwork?: ParentArtwork | null
}

export function PostForm({ threads, defaultThreadId, parentArtwork }: PostFormProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [progressPreviews, setProgressPreviews] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [permission, setPermission] = useState<ForkPermission>('ANY')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fileRef = useRef<HTMLInputElement>(null)
  const progressFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (parentArtwork?.id) {
      const canvasData = sessionStorage.getItem(`canvas_fork_${parentArtwork.id}`)
      if (canvasData) {
        setPreview(canvasData)
        fetch(canvasData)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `canvas-fork-${parentArtwork.id}.png`, { type: 'image/png' })
            const dt = new DataTransfer()
            dt.items.add(file)
            if (fileRef.current) {
              fileRef.current.files = dt.files
            }
          })
          .catch((err) => console.error('Failed to load canvas data:', err))
      }
    }
  }, [parentArtwork])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('ファイルサイズは20MB以下にしてください')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleProgressFiles(files: FileList | null) {
    if (!files) return
    const fileArray = Array.from(files).slice(0, 4)
    const newPreviews: string[] = []

    fileArray.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === fileArray.length) {
          setProgressPreviews(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function handleAddTag() {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setTagInput('')
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('fork_permission', permission)
    formData.set('tags_json', JSON.stringify(tags))

    startTransition(async () => {
      const result = await createArtwork(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {parentArtwork && (
        <input type="hidden" name="parent_artwork_id" value={parentArtwork.id} />
      )}
      {parentArtwork && (
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--color-surface-2)',
            borderRadius: 10,
            border: '1px solid var(--color-border-soft)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <Image
            src={parentArtwork.image_url}
            alt="派生元作品"
            width={64}
            height={64}
            style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
              派生元: {parentArtwork.author.display_name ?? '名無し'}さんの作品
            </div>
            {parentArtwork.comment && (
              <div style={{ fontSize: '0.85rem' }}>{parentArtwork.comment}</div>
            )}
          </div>
        </div>
      )}

      {/* スレッド選択 */}
      <div className="form-group">
        <label className="form-label" htmlFor="thread_id">
          スレッド <span style={{ color: '#ff6b6b' }}>*</span>
        </label>
        <select
          id="thread_id"
          name="thread_id"
          className="form-select"
          defaultValue={defaultThreadId ?? ''}
          required
        >
          <option value="" disabled>スレッドを選択…</option>
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.category_type}] {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* メイン画像アップロード */}
      <div className="form-group">
        <label className="form-label" htmlFor="image-upload">
          主画像（完成絵・最新WIP） <span style={{ color: '#ff6b6b' }}>*</span>
        </label>
        <div
          className={`upload-zone${dragOver ? ' upload-zone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {preview ? (
            <div style={{ position: 'relative', maxHeight: '280px', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="プレビュー" style={{ maxHeight: '280px', margin: 'auto', borderRadius: 8 }} />
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                クリックで変更
              </div>
            </div>
          ) : (
            <>
              <div className="upload-zone__icon">
                <ImageIcon size={40} strokeWidth={1} />
              </div>
              <div className="upload-zone__text">
                <Upload size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                ドラッグ＆ドロップ、またはクリックして選択
              </div>
              <div className="upload-zone__sub">PNG, JPG, WebP, GIF — 最大20MB</div>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          id="image-upload"
          type="file"
          name="image"
          accept="image/*"
          required
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {/* WIP過程画像（任意・最大4枚） */}
      <div className="form-group">
        <label className="form-label flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[var(--color-accent)]" />
          <span>WIP制作過程の画像（任意・下描き/線画など最大4枚）</span>
        </label>
        <button
          type="button"
          onClick={() => progressFileRef.current?.click()}
          className="btn btn--ghost btn--sm w-full border-dashed flex items-center justify-center gap-2 py-3"
        >
          <Upload className="w-4 h-4" />
          <span>過程画像をまとめて選択...</span>
        </button>
        <input
          ref={progressFileRef}
          type="file"
          name="progress_images"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleProgressFiles(e.target.files)}
        />
        {progressPreviews.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2">
            {progressPreviews.map((p, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--color-border-soft)] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`過程 ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-black/70 text-[0.6rem] text-white px-1">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ゆるいタグ入力 */}
      <div className="form-group">
        <label className="form-label flex items-center gap-1.5">
          <TagIcon className="w-4 h-4 text-[var(--color-accent)]" />
          <span>タグ（任意）</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                tags.includes(tag)
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border-soft)] hover:border-[var(--color-border)]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="タグを入力してEnter..."
            className="form-input text-xs flex-1"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="btn btn--ghost btn--sm"
          >
            追加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((tag) => (
              <span key={tag} className="text-xs text-[var(--color-accent)] font-semibold bg-[var(--color-accent-dim)] px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* コメント */}
      <div className="form-group">
        <label className="form-label" htmlFor="comment">
          ひとことコメント（任意）
        </label>
        <textarea
          id="comment"
          name="comment"
          className="form-textarea"
          placeholder="描きかけ供養中…とか、練習絵です、でも何でも"
          maxLength={500}
          style={{ minHeight: '80px' }}
        />
      </div>

      {/* フォーク許諾 */}
      <div className="form-group">
        <label className="form-label">
          派生（続きを描く）の許可設定
        </label>
        <div className="perm-selector">
          {FORK_PERMISSIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`perm-option${permission === p.value ? ' perm-option--selected' : ''}`}
              onClick={() => setPermission(p.value)}
              aria-pressed={permission === p.value}
            >
              <span className={`perm-option__label perm-badge--${p.value}`}>
                <ForkBadge permission={p.value} />
              </span>
              <span className="perm-option__desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn btn--primary"
        disabled={isPending}
        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
      >
        {isPending ? '投稿中…' : '置いていく'}
      </button>
    </form>
  )
}
