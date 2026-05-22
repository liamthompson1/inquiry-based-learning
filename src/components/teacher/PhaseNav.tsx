'use client'
import type { PhaseId } from '@/lib/types'

const PHASES: { id: PhaseId; label: string; description: string }[] = [
  { id: 'engage', label: 'Engage', description: 'Hook curiosity' },
  { id: 'explore', label: 'Explore', description: 'Hands-on inquiry' },
  { id: 'explain', label: 'Explain', description: 'Construct knowledge' },
  { id: 'elaborate', label: 'Elaborate', description: 'Apply & extend' },
  { id: 'evaluate', label: 'Evaluate', description: 'Reflect & assess' }
]

interface PhaseNavProps {
  currentPhase: PhaseId
  onAdvance: () => void
  disabled?: boolean
}

export default function PhaseNav({ currentPhase, onAdvance, disabled }: PhaseNavProps) {
  const currentIndex = PHASES.findIndex(p => p.id === currentPhase)

  return (
    <div className="flex items-center gap-2">
      {PHASES.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-2">
          <div className={`flex flex-col items-center gap-0.5 ${i <= currentIndex ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${i < currentIndex ? 'bg-indigo-600 text-white' : ''}
              ${i === currentIndex ? 'bg-white ring-2 ring-indigo-600 text-indigo-600' : ''}
              ${i > currentIndex ? 'bg-white/20 text-white/60' : ''}
            `}>
              {i < currentIndex ? '✓' : i + 1}
            </div>
            <span className="text-xs font-medium text-white/80">{phase.label}</span>
          </div>
          {i < PHASES.length - 1 && (
            <div className={`w-6 h-0.5 ${i < currentIndex ? 'bg-indigo-400' : 'bg-white/20'}`} />
          )}
        </div>
      ))}

      {currentIndex < PHASES.length - 1 && (
        <button
          onClick={onAdvance}
          disabled={disabled}
          className="ml-4 px-4 py-2 bg-white text-indigo-700 font-semibold text-sm rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
        >
          Next: {PHASES[currentIndex + 1].label} →
        </button>
      )}
    </div>
  )
}
