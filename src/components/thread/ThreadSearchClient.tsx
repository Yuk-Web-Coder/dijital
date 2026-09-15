'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, X } from 'lucide-react'
import type { Thread } from '@/types'

type ThreadWithCount = Thread & { artworks: { count: number }[] }

interface Props {
  threads: ThreadWithCount[]
}

const CATEGORY_LABELS: Record<string, string> = {
  free: 'フリー',
  oekaki: '落書き',
  nuriebase: '塗り絵',
  background: '背景',
  fanart: 'ファンアート',
  critique: '批評',
  collab: 'コラボ',
}

export function ThreadSearchClient({ threads }: Props) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(threads.map((t) => t.category_type).filter(Boolean)))
    return cats
  }, [threads])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads.filter((thread) => {
      const matchesQuery =
        !q ||
        thread.title.toLowerCase().includes(q) ||
        (thread.description ?? '').toLowerCase().includes(q)
      const matchesCategory =
        selectedCategory === 'all' || thread.category_type === selectedCategory
      return matchesQuery && matchesCategory
    })
  }, [threads, query, selectedCategory])

  return (
    <div>
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          alignItems: 'center',
        }}
      >
        {/* Text Input */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 220px',
            minWidth: 0,
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder="スレッドを検索…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
              paddingRight: query ? '2.25rem' : '0.75rem',
              paddingBlock: '0.5rem',
              background: 'var(--surface-paper)',
              border: '1px solid var(--line-graphite)',
              borderRadius: '2px',
              color: 'var(--ink-primary)',
              fontFamily: "'BIZ UDPGothic', sans-serif",
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pigment-blue)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line-graphite)')}
            aria-label="スレッドを検索"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="検索をクリア"
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-faint)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
          }}
          role="group"
          aria-label="カテゴリフィルター"
        >
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              style={{
                padding: '0.25rem 0.7rem',
                borderRadius: '2px',
                fontSize: '0.73rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.02em',
                borderColor:
                  selectedCategory === cat ? 'var(--pigment-blue)' : 'var(--line-graphite)',
                background:
                  selectedCategory === cat
                    ? 'var(--pigment-blue)'
                    : 'var(--surface-tinted)',
                color:
                  selectedCategory === cat ? 'var(--surface-paper)' : 'var(--ink-muted)',
              }}
            >
              {cat === 'all' ? 'すべて' : (CATEGORY_LABELS[cat] ?? cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {(query || selectedCategory !== 'all') && (
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--color-text-faint)',
            marginBottom: '0.75rem',
          }}
        >
          {filtered.length} 件のスレッドが見つかりました
        </p>
      )}

      {/* Thread List */}
      <div className="thread-list stagger" role="list">
        {filtered.length === 0 ? (
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              padding: '3rem',
            }}
          >
            {threads.length === 0 ? 'スレッドがまだありません' : '該当するスレッドが見つかりませんでした'}
          </p>
        ) : (
          filtered.map((thread) => (
            <Link
              key={thread.id}
              href={`/threads/${thread.id}`}
              className="thread-item"
              role="listitem"
              aria-label={`${thread.title}（${thread.artworks?.[0]?.count ?? 0}件）`}
            >
              <span className={`thread-item__category cat--${thread.category_type}`}>
                {thread.category_type}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="thread-item__title">
                  {query
                    ? highlightMatch(thread.title, query)
                    : thread.title}
                </div>
                {thread.description && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-faint)',
                      marginTop: '0.15rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {thread.description}
                  </div>
                )}
              </div>
              <span className="thread-item__meta">
                {thread.artworks?.[0]?.count ?? 0} 件
              </span>
              <ArrowRight
                size={14}
                style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

/** キーワードにマッチした部分をハイライト */
function highlightMatch(text: string, query: string) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'var(--pigment-blue-lt)',
          color: 'var(--pigment-blue)',
          borderRadius: '2px',
          paddingInline: '2px',
          outline: '1px solid rgba(45,75,117,0.25)',
        }}
      >
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}
