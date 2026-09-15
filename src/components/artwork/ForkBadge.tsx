import type { ForkPermission } from '@/types'
import { Lock, Paintbrush, Mountain, GitFork } from 'lucide-react'

const LABELS: Record<ForkPermission, { label: string; short: string; icon: React.ReactNode }> = {
  ANY: {
    label: '派生自由',
    short: '自由',
    icon: <GitFork size={10} strokeWidth={1.5} />,
  },
  COLOR_ONLY: {
    label: '着彩のみ',
    short: '着彩',
    icon: <Paintbrush size={10} strokeWidth={1.5} />,
  },
  BACKGROUND_ONLY: {
    label: '背景追加のみ',
    short: '背景',
    icon: <Mountain size={10} strokeWidth={1.5} />,
  },
  LOCKED: {
    label: '閲覧のみ',
    short: '施錠',
    icon: <Lock size={10} strokeWidth={1.5} />,
  },
}

interface ForkBadgeProps {
  permission: ForkPermission
  compact?: boolean
}

export function ForkBadge({ permission, compact = false }: ForkBadgeProps) {
  const info = LABELS[permission]
  return (
    <span
      className={`tape-badge perm-badge--${permission}`}
      aria-label={info.label}
    >
      {info.icon}
      {compact ? info.short : info.label}
    </span>
  )
}

