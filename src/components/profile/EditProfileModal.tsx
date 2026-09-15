'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { User, X, Save, Edit3 } from 'lucide-react'

interface EditProfileModalProps {
  initialDisplayName: string
  initialBio?: string
  initialAvatarUrl?: string
}

export function EditProfileModal({
  initialDisplayName,
  initialBio = '',
  initialAvatarUrl = '',
}: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await updateProfile({
        displayName,
        bio,
        avatarUrl,
      })

      if (res?.error) {
        setError(res.error)
        return
      }

      setIsOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn--outline text-xs"
        style={{ padding: '0.4rem 0.8rem', gap: '0.4rem' }}
      >
        <Edit3 size={13} />
        <span>プロフィール編集</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[var(--ink-primary)]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="atelier-card max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <User size={18} className="text-[var(--pigment-blue)]" />
                <span>プロフィールを編集</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-display-name">
                  表示名
                </label>
                <input
                  id="edit-display-name"
                  type="text"
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-bio">
                  自己紹介 / アトリエメモ
                </label>
                <textarea
                  id="edit-bio"
                  className="form-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="一言や使用ツールなど自由に入力してください"
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-avatar">
                  アイコン画像URL (任意)
                </label>
                <input
                  id="edit-avatar"
                  type="url"
                  className="form-input"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              {error && <div className="alert alert--error text-xs">{error}</div>}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-soft)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn--ghost text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="btn btn--primary text-xs"
                >
                  <Save size={13} />
                  {isPending ? '保存中…' : '変更を保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
