'use server'

import { createClient } from '@/lib/supabase/server'

export interface LineageNodeData {
  id: string
  imageUrl: string
  comment: string | null
  authorName: string
  forkPermission: string
  createdAt: string
  isCurrent: boolean
}

export interface LineageGraphData {
  nodes: {
    id: string
    data: LineageNodeData
  }[]
  edges: {
    id: string
    source: string
    target: string
  }[]
}

export async function getArtworkLineage(targetArtworkId: string): Promise<LineageGraphData | null> {
  const supabase = await createClient()

  // 1. 対象作品の根祖先（Root ancestor）を検索
  const { data: rootRelation } = await supabase
    .from('artwork_lineage')
    .select('ancestor_id')
    .eq('descendant_id', targetArtworkId)
    .order('depth', { ascending: false })
    .limit(1)
    .single()

  if (!rootRelation) return null
  const rootId = rootRelation.ancestor_id

  // 2. 根祖先から広がるすべての全子孫（この家系図に属する全作品ID）を取得
  const { data: familyRelations } = await supabase
    .from('artwork_lineage')
    .select('descendant_id')
    .eq('ancestor_id', rootId)

  if (!familyRelations || familyRelations.length === 0) return null

  const familyIds = Array.from(new Set(familyRelations.map((r) => r.descendant_id)))

  // 3. この家系図に含まれる作品の情報を一括取得（親ID含む）
  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, image_url, comment, fork_permission, created_at, parent_artwork_id, author:profiles!author_id(display_name)')
    .in('id', familyIds)
    .eq('is_blinded', false)

  if (!artworks) return null

  const nodes = artworks.map((art) => ({
    id: art.id,
    data: {
      id: art.id,
      imageUrl: art.image_url,
      comment: art.comment,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorName: (art.author as any)?.display_name ?? '名無し',
      forkPermission: art.fork_permission,
      createdAt: art.created_at,
      isCurrent: art.id === targetArtworkId,
    },
  }))

  const edges: { id: string; source: string; target: string }[] = []
  artworks.forEach((art) => {
    if (art.parent_artwork_id && familyIds.includes(art.parent_artwork_id)) {
      edges.push({
        id: `e-${art.parent_artwork_id}-${art.id}`,
        source: art.parent_artwork_id,
        target: art.id,
      })
    }
  })

  return { nodes, edges }
}
