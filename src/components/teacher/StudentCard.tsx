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

  return (
    <div style={{
      position: 'relative',
      background: 'var(--surface-raised)',
      border: `1px solid ${highFlags.length > 0 ? 'rgba(255,69,58,0.4)' : 'var(--divider)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'box-shadow 0.3s, transform 0.3s',
      boxShadow: highFlags.length > 0 ? '0 0 0 3px rgba(255,69,58,0.12)' : 'none',
      opacity: student.isActive ? 1 : 0.45
    }}>
      {highFlags.length > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--red)', boxShadow: '0 0 0 2px var(--bg-primary)',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.016em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {student.name}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'capitalize', letterSpacing: '-0.008em', flexShrink: 0, marginLeft: '8px' }}>
          {student.phase}
        </span>
      </div>

      {evaluation
        ? <UnderstandingBadge understanding={evaluation.understanding} score={evaluation.score} />
        : <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            {student.submissions.length === 0 ? 'Not started' : 'Evaluating…'}
          </span>
      }

      {latest?.content && (
        <p style={{
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
          padding: '8px 10px', letterSpacing: '-0.008em'
        }}>
          {latest.content}
        </p>
      )}

      {student.flags.length > 0 && (
        <div style={{
          fontSize: '12px', color: 'var(--amber)', background: 'rgba(255,159,10,0.08)',
          border: '1px solid rgba(255,159,10,0.2)', borderRadius: 'var(--radius-sm)',
          padding: '6px 10px', letterSpacing: '-0.008em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          ⚑ {student.flags.at(-1)?.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
        <button
          onClick={() => onPushHint(student.socketId)}
          style={{
            flex: 1, fontSize: '13px', padding: '7px',
            background: 'rgba(0,113,227,0.08)', color: 'var(--accent)',
            border: '1px solid rgba(0,113,227,0.15)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.008em',
            transition: 'background 0.2s', fontWeight: 500
          }}>
          Send hint
        </button>
        <button
          onClick={() => onWalkOver(student)}
          style={{
            flex: 1, fontSize: '13px', padding: '7px',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
            border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.008em',
            transition: 'background 0.2s'
          }}>
          Walk over
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
