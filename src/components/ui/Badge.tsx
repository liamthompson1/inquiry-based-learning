import type { Understanding } from '@/lib/types'

interface BadgeProps {
  understanding: Understanding
  score?: number
}

const config: Record<Understanding, { label: string; cls: string }> = {
  strong:     { label: 'Strong',     cls: 'badge-strong' },
  partial:    { label: 'Partial',    cls: 'badge-partial' },
  struggling: { label: 'Struggling', cls: 'badge-struggling' }
}

export default function UnderstandingBadge({ understanding, score }: BadgeProps) {
  const { label, cls } = config[understanding]
  return (
    <span className={cls} style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '980px', fontSize: '12px', fontWeight: 500,
      letterSpacing: '-0.008em'
    }}>
      {label}
      {score !== undefined && <span style={{ opacity: 0.6 }}>· {score}</span>}
    </span>
  )
}
