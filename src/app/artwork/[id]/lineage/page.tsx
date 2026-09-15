import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArtworkLineage } from '@/lib/actions/lineage'
import { LineageTree } from '@/components/lineage/LineageTree'
import { ArrowLeft, GitFork } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '作品の系譜（家系図）',
  description: 'この作品から広がる創作の系譜ツリー',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function LineagePage({ params }: Props) {
  const { id } = await params
  const graphData = await getArtworkLineage(id)

  if (!graphData || graphData.nodes.length === 0) {
    notFound()
  }

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/artwork/${id}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>作品詳細へ戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <GitFork className="w-6 h-6 text-[var(--color-accent)]" />
            <span>作品の系譜（ツリー）</span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            未完成や落書きからつながった創作の系譜です。ドラッグやズームで全体を見渡せます。
          </p>
        </div>

        <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-2 rounded-lg border border-[var(--color-border-soft)]">
          全 <span className="font-bold text-[var(--color-accent)]">{graphData.nodes.length}</span> 作品のつながり
        </div>
      </div>

      <LineageTree data={graphData} />
    </div>
  )
}
