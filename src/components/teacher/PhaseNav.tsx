'use client'
import type { PhaseId } from '@/lib/types'

const PHASES: { id: PhaseId; label: string }[] = [
  { id: 'engage',    label: 'Engage' },
  { id: 'explore',   label: 'Explore' },
  { id: 'explain',   label: 'Explain' },
  { id: 'elaborate', label: 'Elaborate' },
  { id: 'evaluate',  label: 'Evaluate' },
]

interface PhaseNavProps {
  currentPhase: PhaseId
  onAdvance: () => void
  disabled?: boolean
}

export default function PhaseNav({ currentPhase, onAdvance, disabled }: PhaseNavProps) {
  const currentIndex = PHASES.findIndex(p => p.id === currentPhase)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {PHASES.map((phase, i) => (
        <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            opacity: i <= currentIndex ? 1 : 0.35,
            transition: 'opacity 0.3s'
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: i < currentIndex
                ? 'rgba(48,209,88,0.15)' : i === currentIndex
                ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: i === currentIndex ? '1.5px solid rgba(255,255,255,0.7)' : '1.5px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'white', fontWeight: 600,
              flexShrink: 0, transition: 'all 0.3s'
            }}>
              {i < currentIndex ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: i === currentIndex ? 600 : 400,
              letterSpacing: '-0.008em'
            }}>{phase.label}</span>
          </div>
          {i < PHASES.length - 1 && (
            <div style={{
              width: 20, height: 1,
              background: i < currentIndex ? 'rgba(48,209,88,0.5)' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.3s'
            }} />
          )}
        </div>
      ))}

      {currentIndex < PHASES.length - 1 && (
        <button
          onClick={onAdvance}
          disabled={disabled}
          style={{
            marginLeft: '12px', padding: '6px 14px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '980px',
            color: 'white', fontSize: '13px', fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            fontFamily: 'inherit', letterSpacing: '-0.008em',
            transition: 'background 0.2s, opacity 0.2s'
          }}>
          {PHASES[currentIndex + 1].label} →
        </button>
      )}
    </div>
  )
}
