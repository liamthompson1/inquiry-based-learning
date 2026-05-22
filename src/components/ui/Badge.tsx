import type { Understanding } from '@/lib/types'

interface BadgeProps {
  understanding: Understanding
  score?: number
}

const config: Record<Understanding, { label: string; className: string }> = {
  strong: { label: 'Strong', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-800 border border-amber-200' },
  struggling: { label: 'Struggling', className: 'bg-red-100 text-red-800 border border-red-200' }
}

export default function UnderstandingBadge({ understanding, score }: BadgeProps) {
  const { label, className } = config[understanding]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
      {score !== undefined && <span className="opacity-60">· {score}</span>}
    </span>
  )
}
