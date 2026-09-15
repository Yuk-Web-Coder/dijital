'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WebCanvasEditor } from '@/components/canvas/WebCanvasEditor'
import { PenLine, Download, Lock, Palette, FileImage, X, GitFork } from 'lucide-react'
import type { ForkPermission } from '@/types'

interface ForkChoiceModalProps {
  artworkId: string
  imageUrl: string
  authorName: string
  forkPermission: ForkPermission
}

export function ForkChoiceModal({
  artworkId,
  imageUrl,
  authorName,
  forkPermission,
}: ForkChoiceModalProps) {
  const [isChoiceOpen, setIsChoiceOpen] = useState(false)
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const router = useRouter()

  if (forkPermission === 'LOCKED') {
    return (
      <div className="btn btn--outline opacity-50 cursor-not-allowed text-xs py-2 px-3 flex items-center gap-1.5">
        <Lock size={14} />
        <span>続き描き不可 (LOCKED)</span>
      </div>
    )
  }

  // 1. Webキャンバス完了時のフォーク投稿遷移
  const handleExportAndPost = (dataUrl: string) => {
    try {
      sessionStorage.setItem(`canvas_fork_${artworkId}`, dataUrl)
    } catch (e) {
      console.error('Failed to store canvas data in sessionStorage:', e)
    }
    setIsCanvasOpen(false)
    router.push(`/post?fork=${artworkId}&canvas=true`)
  }

  // 2. 外部アプリ用に画像を保存して投稿フォームへ遷移
  const handleDownloadAndGoToPost = () => {
    // 画像ダウンロードの実行
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `atelier-artwork-${artworkId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setIsChoiceOpen(false)
    // 投稿画面へ遷移
    router.push(`/post?fork=${artworkId}`)
  }

  return (
    <>
      <button
        onClick={() => setIsChoiceOpen(true)}
        className="btn btn--primary"
      >
        <GitFork size={15} />
        <span>続きを描く</span>
      </button>

      {/* 2択選択モーダル */}
      {isChoiceOpen && (
        <div className="fixed inset-0 bg-[var(--ink-primary)]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="atelier-card max-w-md w-full p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[var(--ink-primary)] flex items-center gap-2">
                  <PenLine size={18} className="text-[var(--pigment-blue)]" />
                  <span>「続きを描く」方法を選択</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {authorName} さんの作品に描き足し・派生作品を作成します
                </p>
              </div>
              <button
                onClick={() => setIsChoiceOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--ink-primary)] p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* 選択肢 1: サイト内で描き足す */}
            <div
              onClick={() => {
                setIsChoiceOpen(false)
                setIsCanvasOpen(true)
              }}
              className="p-4 rounded-xs border border-[var(--color-border-soft)] bg-[var(--surface-paper)] hover:border-[var(--pigment-blue)] hover:bg-[var(--pigment-blue-lt)] cursor-pointer transition-all group shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xs bg-[var(--bg-gesso)] border border-[var(--color-border-soft)] text-[var(--pigment-blue)] group-hover:bg-[var(--pigment-blue)] group-hover:text-white transition-colors">
                  <Palette size={22} strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <div className="font-serif font-bold text-sm text-[var(--ink-primary)] group-hover:text-[var(--pigment-blue)] flex items-center gap-1.5">
                    <span>サイト内で描き足す (Webキャンバス)</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    ブラウザ上で直接ペン・筆を使って描き足せます。アプリのダウンロード不要でサクッと参加できます。
                  </p>
                </div>
              </div>
            </div>

            {/* 選択肢 2: 自分のアプリで描く */}
            <div
              onClick={handleDownloadAndGoToPost}
              className="p-4 rounded-xs border border-[var(--color-border-soft)] bg-[var(--surface-paper)] hover:border-[var(--pigment-red)] hover:bg-amber-500/10 cursor-pointer transition-all group shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xs bg-[var(--bg-gesso)] border border-[var(--color-border-soft)] text-[var(--pigment-red)] group-hover:bg-[var(--pigment-red)] group-hover:text-white transition-colors">
                  <Download size={22} strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <div className="font-serif font-bold text-sm text-[var(--ink-primary)] group-hover:text-[var(--pigment-red)] flex items-center gap-1.5">
                    <span>自分のアプリで描いて投稿 (画像保存)</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    元画像をダウンロードし、クリスタやアイビスペイント等のペイントソフトで制作してから投稿します。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--color-border-soft)]">
              <button
                onClick={() => setIsChoiceOpen(false)}
                className="btn btn--ghost text-xs"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webキャンバス Studio エディタ */}
      {isCanvasOpen && (
        <WebCanvasEditor
          parentArtworkId={artworkId}
          parentImageUrl={imageUrl}
          parentAuthorName={authorName}
          onClose={() => setIsCanvasOpen(false)}
          onExportAndPost={handleExportAndPost}
        />
      )}
    </>
  )
}
