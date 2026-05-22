'use client'
import type { StudentState } from '@/lib/types'
import UnderstandingBadge from '@/components/ui/Badge'

interface StudentCardProps {
  student: StudentState
  onPushHint: (socketId: string) => void
  onWalkOver: (student: StudentState) => void
}

export default function StudentCard({ student, onPushHint, onWalkOver }: StudentCardProps) {
  const latest = student.submissions.at(-1)
  const evaluation = latest?.aiEvaluation
  const highFlags = student.flags.filter(f => f.severity === 'high')
  const isInactive = !student.isActive

  return (
    <div className={`
      relative bg-white rounded-xl border p-4 flex flex-col gap-2 transition-all
      ${highFlags.length > 0 ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}
      ${isInactive ? 'opacity-50' : ''}
    `}>
      {highFlags.length > 0 && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}

      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-sm truncate">{student.name}</span>
        <span className="text-xs text-slate-400 capitalize">{student.phase}</span>
      </div>

      {evaluation ? (
        <UnderstandingBadge understanding={evaluation.understanding} score={evaluation.score} />
      ) : (
        <span className="text-xs text-slate-400 italic">
          {student.submissions.length === 0 ? 'Not started' : 'Evaluating…'}
        </span>
      )}

      {latest && (
        <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 rounded p-2">
          {latest.content || <em>No text</em>}
        </p>
      )}

      {student.flags.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 rounded p-1.5 truncate">
          ⚑ {student.flags.at(-1)?.message}
        </div>
      )}

      <div className="flex gap-1.5 pt-1">
        <button
          onClick={() => onPushHint(student.socketId)}
          className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg py-1.5 transition-colors"
        >
          Send hint
        </button>
        <button
          onClick={() => onWalkOver(student)}
          className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 transition-colors"
        >
          Walk over
        </button>
      </div>
    </div>
  )
}
