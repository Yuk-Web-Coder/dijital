import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Thread, Artwork } from '@/types'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import { ArrowRight, PenLine, User } from 'lucide-react'
import type { ForkPermission } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 1. スレッド一覧 (3件に限定)
  const { data: threads } = await supabase
    .from('threads')
    .select('*, artworks(count)')
    .order('created_at', { ascending: true })
    .limit(3)

  // 2. 最新の投稿作品 (8件)
  const { data: recentArtworks } = await supabase
    .from('artworks')
    .select('*, author:profiles!author_id(id, display_name)')
    .eq('is_blinded', false)
    .order('created_at', { ascending: false })
    .limit(8)

  // 3. ログイン中ユーザーがフォローしている作者の作品
  let followedArtworks: Artwork[] = []
  if (user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    if (follows && follows.length > 0) {
      const followingIds = follows.map((f) => f.following_id)
      const { data: fArtworks } = await supabase
        .from('artworks')
        .select('*, author:profiles!author_id(id, display_name)')
        .in('author_id', followingIds)
        .eq('is_blinded', false)
        .order('created_at', { ascending: false })
        .limit(8)
      followedArtworks = (fArtworks ?? []) as Artwork[]
    }
  }

  const threadList = (threads ?? []) as (Thread & { artworks: { count: number }[] })[]
  const recentList = (recentArtworks ?? []) as Artwork[]

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        style={{
          textAlign: 'center',
          paddingBlock: '3.5rem 3rem',
          borderBottom: '1px solid var(--line-graphite)',
          marginBottom: '2.5rem',
        }}
      >
        {/* Ink mark — replaces emoji */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            border: '1.5px solid var(--ink-primary)',
            borderRadius: '2px',
            marginBottom: '1.5rem',
            color: 'var(--pigment-blue)',
          }}
          aria-hidden
        >
          <PenLine size={26} strokeWidth={1.25} />
        </div>

        <h1
          style={{
            fontFamily: "'Shippori Mincho', 'Yu Mincho', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1.3,
            marginBottom: '1rem',
            color: 'var(--ink-primary)',
          }}
        >
          描いたから、
          <br />
          <span style={{ color: 'var(--pigment-blue)' }}>
            とりあえず置いていく場所。
          </span>
        </h1>

        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.875rem',
            color: 'var(--ink-muted)',
            maxWidth: '440px',
            marginInline: 'auto',
            lineHeight: 1.75,
            letterSpacing: '-0.01em',
          }}
        >
          完成してなくていい。いいねを競わなくていい。
          <br />
          落書き・WIP・練習絵を気兼ねなく投稿できる場所。
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.625rem',
            justifyContent: 'center',
            marginTop: '1.75rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/threads" className="btn btn--blue btn--lg">
            掲示板をみる
            <ArrowRight size={15} strokeWidth={1.5} />
          </Link>
          {!user && (
            <Link href="/auth/signup" className="btn btn--ghost btn--lg">
              <PenLine size={14} strokeWidth={1.5} />
              参加する（無料）
            </Link>
          )}
        </div>
      </section>

      {/* ── フォロー中の新着作品 ──────────────────────────── */}
      {user && followedArtworks.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              gap: '0.5rem',
            }}
          >
            <h2 className="section-heading" style={{ flex: 1 }}>
              フォロー中ユーザーの新着作品
            </h2>
          </div>

          <div className="artwork-grid stagger">
            {followedArtworks.map((art) => (
              <Link key={art.id} href={`/artwork/${art.id}`} className="artwork-card">
                <div className="artwork-card__image-wrap">
                  <Image src={art.image_url} alt="作品" fill className="object-cover" />
                  <span className={`artwork-card__fork-badge perm-badge--${art.fork_permission}`}>
                    <ForkBadge permission={art.fork_permission as ForkPermission} compact />
                  </span>
                </div>
                <div className="artwork-card__body">
                  <div className="artwork-card__author">
                    <User size={11} strokeWidth={1.5} />
                    {art.author?.display_name ?? '名無し'}
                  </div>
                  {art.comment && <p className="artwork-card__comment">{art.comment}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── みんなの最新投稿 ─────────────────────────────── */}
      {recentList.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 className="section-heading" style={{ flex: 1 }}>
              みんなの最新投稿
            </h2>
          </div>

          <div className="artwork-grid stagger">
            {recentList.map((art) => (
              <Link key={art.id} href={`/artwork/${art.id}`} className="artwork-card">
                <div className="artwork-card__image-wrap">
                  <Image src={art.image_url} alt="作品" fill className="object-cover" />
                  <span className={`artwork-card__fork-badge perm-badge--${art.fork_permission}`}>
                    <ForkBadge permission={art.fork_permission as ForkPermission} compact />
                  </span>
                </div>
                <div className="artwork-card__body">
                  <div className="artwork-card__author">
                    <User size={11} strokeWidth={1.5} />
                    {art.author?.display_name ?? '名無し'}
                  </div>
                  {art.comment && <p className="artwork-card__comment">{art.comment}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── スレッド一覧 ─────────────────────────────────── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.875rem',
          }}
        >
          <h2 className="section-heading" style={{ flex: 1 }}>
            スレッド一覧
          </h2>
          <Link
            href="/threads"
            style={{
              fontSize: '0.78rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              marginLeft: '0.75rem',
              flexShrink: 0,
            }}
          >
            すべて見る
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="thread-list stagger">
          {threadList.length === 0 ? (
            <p
              style={{
                color: 'var(--ink-muted)',
                textAlign: 'center',
                padding: '2rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.85rem',
              }}
            >
              スレッドがまだありません
            </p>
          ) : (
            threadList.map((thread) => (
              <Link
                key={thread.id}
                href={`/threads/${thread.id}`}
                className="thread-item"
                aria-label={`${thread.title}スレッドを開く`}
              >
                <span className={`thread-item__category cat--${thread.category_type}`}>
                  {thread.category_type}
                </span>
                <span className="thread-item__title">{thread.title}</span>
                <span className="thread-item__meta">
                  {thread.artworks?.[0]?.count ?? 0} 件
                </span>
                <ArrowRight size={13} strokeWidth={1.5} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
