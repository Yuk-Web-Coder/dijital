import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FollowButton } from '@/components/user/FollowButton'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { AtelierTabContent } from '@/components/atelier/AtelierTabContent'
import { getFollowStatus } from '@/lib/actions/follows'
import { getUserBookmarks } from '@/lib/actions/bookmarks'
import { Palette, GitFork, Calendar, Users, User, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import type { Artwork } from '@/types'

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single()

  return {
    title: profile ? `${profile.display_name}のアトリエ` : 'アトリエ',
    description: '投稿作品と派生作品の一覧',
  }
}

export default async function AtelierPage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()

  // 1. ユーザープロフィールの取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  // 2. 現在のログインユーザー & フォロー状態
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isMe = currentUser?.id === userId
  const followStatus = await getFollowStatus(userId)

  // 3. このユーザーが投稿した全作品
  const { data: ownArtworks } = await supabase
    .from('artworks')
    .select(`
      *,
      author:profiles!author_id(id, display_name),
      reactions(reaction_type)
    `)
    .eq('author_id', userId)
    .eq('is_blinded', false)
    .order('created_at', { ascending: false })

  const ownList = (ownArtworks ?? []) as Artwork[]

  // 4. 自分自身の場合、非公開ブックマーク作品を取得
  const bookmarkedArtworks: Artwork[] = isMe ? await getUserBookmarks() : []

  // 5. 投稿作品のうち、フォーク（続きを描いた）作品
  const forkedArtworks = ownList.filter((a) => a.parent_artwork_id !== null)

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>
      {/* ユーザーヘッダー */}
      <div className="bg-[var(--surface-paper)] border border-[var(--color-border-soft)] rounded-xs p-6 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xs bg-[var(--bg-gesso)] border border-[var(--color-border-soft)] flex items-center justify-center text-2xl overflow-hidden shrink-0 relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <User size={28} strokeWidth={1.2} className="text-[var(--ink-muted)]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl font-bold text-[var(--ink-primary)]">
                {profile.display_name}
              </h1>
              {isMe ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-xs bg-[var(--pigment-blue-lt)] text-[var(--pigment-blue)] font-medium">
                    あなたのアトリエ
                  </span>
                  <EditProfileModal
                    initialDisplayName={profile.display_name}
                    initialBio={profile.bio ?? ''}
                    initialAvatarUrl={profile.avatar_url ?? ''}
                  />
                </div>
              ) : (
                currentUser && (
                  <FollowButton
                    targetUserId={userId}
                    initialIsFollowing={followStatus.isFollowing}
                  />
                )
              )}
            </div>

            {profile.bio && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(profile.created_at).toLocaleDateString('ja-JP')} 登録
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[var(--pigment-blue)]" />
                フォロワー <strong className="text-[var(--ink-primary)]">{followStatus.followersCount}</strong> 人
              </span>
              <span className="flex items-center gap-1">
                フォロー中 <strong className="text-[var(--ink-primary)]">{followStatus.followingCount}</strong> 人
              </span>
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                全 {ownList.length} 作品
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" />
                派生 {forkedArtworks.length} 作品
              </span>
            </div>
          </div>
        </div>

        {isMe && (
          <Link href="/post" className="btn btn--primary shrink-0 self-start md:self-auto">
            <Plus size={15} />
            <span>新しい絵を置いていく</span>
          </Link>
        )}
      </div>

      {/* タブコンテンツ＆作品一覧＆ページネーション */}
      <AtelierTabContent
        ownArtworks={ownList}
        forkedArtworks={forkedArtworks}
        bookmarkedArtworks={bookmarkedArtworks}
        isMe={isMe}
      />
    </div>
  )
}
