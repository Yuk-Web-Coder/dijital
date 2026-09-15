'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Layers } from 'lucide-react'

interface WipProgressViewerProps {
  mainImageUrl: string
  progressImages?: string[] | null
  comment?: string | null
}

export function WipProgressViewer({ mainImageUrl, progressImages, comment }: WipProgressViewerProps) {
  const images = [mainImageUrl, ...(progressImages ?? [])]
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!progressImages || progressImages.length === 0) {
    return (
      <div className="artwork-detail__image-wrap mb-4">
        <Image
          src={mainImageUrl}
          alt={comment ?? '投稿画像'}
          width={1200}
          height={900}
          className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
          priority
        />
      </div>
    )
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="artwork-detail__image-wrap relative">
        <Image
          src={images[selectedIndex]}
          alt={`過程画像 Step ${selectedIndex + 1}`}
          width={1200}
          height={900}
          className="w-full h-auto max-h-[70vh] object-contain rounded-xl transition-all duration-200"
          priority
        />

        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
          <Layers className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>制作ステップ {selectedIndex + 1} / {images.length}</span>
        </div>
      </div>

      {/* ステップ切り替えタブ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
              selectedIndex === idx
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] ring-1 ring-[var(--color-accent)]'
                : 'border-[var(--color-border-soft)] bg-[var(--color-surface-2)] opacity-70 hover:opacity-100'
            }`}
          >
            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[var(--color-surface-3)]">
              <Image src={img} alt={`Step ${idx + 1}`} fill className="object-cover" />
            </div>
            <span className="text-xs font-semibold pr-2 text-[var(--color-text)]">
              {idx === 0 ? '完成/主画像' : `過程 ${idx}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
