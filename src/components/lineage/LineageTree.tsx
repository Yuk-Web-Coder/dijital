'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { ForkBadge } from '@/components/artwork/ForkBadge'
import type { LineageGraphData, LineageNodeData } from '@/lib/actions/lineage'
import type { ForkPermission } from '@/types'

// カスタムノードコンポーネント
function ArtworkNode({ data }: NodeProps<LineageNodeData>) {
  return (
    <div
      className={`p-3 rounded-xl border bg-[var(--color-surface)] shadow-lg transition-all min-w-[200px] max-w-[240px] ${
        data.isCurrent
          ? 'ring-2 ring-[var(--color-accent)] border-[var(--color-accent)] scale-105'
          : 'border-[var(--color-border-soft)] hover:border-[var(--color-border)]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--color-accent)] !w-3 !h-3" />

      <Link href={`/artwork/${data.id}`} className="block group">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[var(--color-surface-2)] mb-2">
          <Image
            src={data.imageUrl}
            alt="作品"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-1.5 right-1.5">
            <ForkBadge permission={data.forkPermission as ForkPermission} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <span>描いた人:</span>
            <span className="font-semibold text-[var(--color-text)] truncate">{data.authorName}</span>
          </div>

          {data.comment && (
            <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 italic">
              「{data.comment}」
            </p>
          )}
        </div>
      </Link>

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--color-accent)] !w-3 !h-3" />
    </div>
  )
}

const nodeTypes = {
  artworkNode: ArtworkNode,
}

interface LineageTreeProps {
  data: LineageGraphData
}

export function LineageTree({ data }: LineageTreeProps) {
  // 自動レイアウト計算 (簡単な深さ優先・幅優先ツリー計算)
  const { nodes, edges } = useMemo(() => {
    const parentMap = new Map<string, string[]>()
    const childrenMap = new Map<string, string[]>()
    const depthMap = new Map<string, number>()

    data.edges.forEach((e) => {
      const children = childrenMap.get(e.source) || []
      children.push(e.target)
      childrenMap.set(e.source, children)

      const parents = parentMap.get(e.target) || []
      parents.push(e.source)
      parentMap.set(e.target, parents)
    })

    // ルートノード検出
    const rootNodes = data.nodes.filter((n) => !parentMap.has(n.id) || parentMap.get(n.id)?.length === 0)

    // 深さ計算
    const queue = rootNodes.map((r) => ({ id: r.id, depth: 0 }))
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      depthMap.set(id, Math.max(depthMap.get(id) || 0, depth))
      const kids = childrenMap.get(id) || []
      kids.forEach((k) => queue.push({ id: k, depth: depth + 1 }))
    }

    // 階層ごとのインデックス計算
    const depthCounts = new Map<number, number>()
    const flowNodes: Node<LineageNodeData>[] = data.nodes.map((n) => {
      const depth = depthMap.get(n.id) || 0
      const xIdx = depthCounts.get(depth) || 0
      depthCounts.set(depth, xIdx + 1)

      return {
        id: n.id,
        type: 'artworkNode',
        data: n.data,
        position: {
          x: xIdx * 280,
          y: depth * 340,
        },
      }
    })

    const flowEdges: Edge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: 'var(--color-accent)', strokeWidth: 2 },
    }))

    return { nodes: flowNodes, edges: flowEdges }
  }, [data])

  return (
    <div className="w-full h-[650px] bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-inner relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#2e2e3a" gap={24} size={1} />
        <Controls className="!bg-[var(--color-surface)] !border-[var(--color-border)] !fill-[var(--color-text)]" />
      </ReactFlow>
    </div>
  )
}
