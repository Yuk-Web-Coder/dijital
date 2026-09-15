// ============================================================
// src/types/index.ts — ドメインエンティティ型定義
// ============================================================

export type ForkPermission = 'ANY' | 'COLOR_ONLY' | 'BACKGROUND_ONLY' | 'LOCKED'

export type ReactionType = '供養' | '味がある' | '続き描きたい' | '完璧' | '好き'

export interface Profile {
  id: string
  display_name: string
  bio?: string | null
  avatar_url?: string | null
  created_at: string
}

export interface Thread {
  id: string
  title: string
  category_type: string
  description: string | null
  author_id?: string | null
  is_pinned?: boolean
  created_at: string
  // 集計（JOIN時）
  artwork_count?: number
}

export interface ThreadMessage {
  id: string
  thread_id: string
  author_id: string
  content: string
  preset_stamp: string | null
  created_at: string
  // JOIN時
  author?: Profile
}

export interface ArtworkComment {
  id: string
  artwork_id: string
  author_id: string
  content: string
  preset_stamp: string | null
  created_at: string
  // JOIN時
  author?: Profile
}

export interface Artwork {
  id: string
  thread_id: string
  author_id: string
  image_url: string
  comment: string | null
  fork_permission: ForkPermission
  parent_artwork_id: string | null
  is_blinded: boolean
  tags?: string[]
  progress_images?: string[]
  created_at: string
  // JOIN時
  author?: Profile
  thread?: Thread
  parent?: Artwork | null
  reactions?: ReactionCount[]
  children_count?: number
}

export interface ReactionCount {
  reaction_type: ReactionType
  count: number
}

export interface ArtworkLineage {
  ancestor_id: string
  descendant_id: string
  depth: number
}

export interface Reaction {
  id: string
  artwork_id: string
  author_id: string | null
  reaction_type: ReactionType
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export type NotificationType = 'FORK' | 'COMMENT' | 'FOLLOW' | 'MENTION'

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: NotificationType
  artwork_id: string | null
  is_read: boolean
  created_at: string
  // JOIN時
  actor?: Profile
  artwork?: Artwork
}

// ============================================================
// UI用の拡張型
// ============================================================

export interface LineageNode {
  id: string
  artwork: Artwork
  children: LineageNode[]
  depth: number
}
