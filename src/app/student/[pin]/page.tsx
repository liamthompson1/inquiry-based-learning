'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useSocket } from '@/lib/socket/client'
import HintOverlay from '@/components/student/HintOverlay'
import type { Session, StudentState, Hint, PhaseId, LessonPhase } from '@/lib/types'

const PHASE_GRADIENTS: Record<string, string> = {
  engage:    'linear-gradient(135deg, #ff9f0a 0%, #ff6b35 100%)',
  explore:   'linear-gradient(135deg, #30d158 0%, #0071e3 100%)',
  explain:   'linear-gradient(135deg, #0071e3 0%, #2997ff 100%)',
  elaborate: 'linear-gradient(135deg, #bf5af2 0%, #ff375f 100%)',
  evaluate:  'linear-gradient(135deg, #ff453a 0%, #bf5af2 100%)',
}

export default function StudentMissionPage() {
  const { pin } = useParams<{ pin: string }>()
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || 'Student'
  const { socket, connected } = useSocket()

  const [session, setSession] = useState<Session | null>(null)
  const [currentPhase, setCurrentPhase] = useState<LessonPhase | null>(null)
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [hints, setHints] = useState<Hint[]>([])
  const [error, setError] = useState('')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!socket || !pin) return
    socket.emit('student:join', { pin, name })
    socket.on('session:joined', ({ session: s }: { session: Session; student: StudentState }) => {
      setSession(s)
      setCurrentPhase(s.lesson.phases.find(p => p.name === s.phase) ?? null)
    })
    socket.on('error', ({ message }: { message: string }) => setError(message))
    socket.on('hint:push', ({ hint }: { hint: Hint }) => setHints(prev => [...prev, hint]))
    socket.on('phase:changed', ({ phase }: { phase: PhaseId }) => {
      setSession(prev => {
        if (!prev) return prev
        const updated = { ...prev, phase }
        setCurrentPhase(updated.lesson.phases.find(p => p.name === phase) ?? null)
        return updated
      })
      setSubmitted(false); setAnswer(''); setSelectedOption(null)
    })
    socket.on('session:paused', () => setPaused(true))
    socket.on('session:resumed', () => setPaused(false))
    return () => {
      socket.off('session:joined'); socket.off('error'); socket.off('hint:push')
      socket.off('phase:changed'); socket.off('session:paused'); socket.off('session:resumed')
    }
  }, [socket, pin, name])

  useEffect(() => {
    if (!socket || !session) return
    const interval = setInterval(() => socket.emit('student:activity'), 30000)
    return () => clearInterval(interval)
  }, [socket, session])

  const handleSubmit = useCallback(() => {
    if (!socket || !currentPhase) return
    const content = currentPhase.studentTask.inputType === 'multiple_choice' ? selectedOption ?? '' : answer
    if (!content.trim()) return
    socket.emit('student:submit', { taskId: currentPhase.studentTask.id, type: currentPhase.studentTask.inputType, content })
    setSubmitted(true)
  }, [socket, currentPhase, answer, selectedOption])

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '360px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✕</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '8px' }}>Can&apos;t join class</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
        <a href="/student" className="btn-primary" style={{ display: 'inline-flex' }}>Try again</a>
      </div>
    </div>
  )

  if (!session || !currentPhase) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--divider)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', letterSpacing: '-0.022em' }}>
          {session ? 'Loading your mission…' : 'Joining class…'}
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (paused) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏸</div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>Class paused</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', letterSpacing: '-0.022em' }}>Your teacher has paused the session.</p>
      </div>
    </div>
  )

  const task = currentPhase.studentTask
  const phaseGradient = PHASE_GRADIENTS[session.phase] || PHASE_GRADIENTS.engage

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <header style={{
        background: phaseGradient, padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 0 rgba(0,0,0,0.1)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'white', letterSpacing: '-0.016em' }}>{session.lesson.topic}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize', marginTop: '1px' }}>{session.phase} phase</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'white', letterSpacing: '-0.016em' }}>{name}</div>
            <div style={{ fontSize: '11px', color: connected ? 'rgba(255,255,255,0.8)' : 'rgba(255,100,100,0.9)' }}>{connected ? '● Live' : '○ Reconnecting'}</div>
          </div>
          {hints.length > 0 && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px'
            }}>💡</div>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Phase pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            padding: '4px 14px', borderRadius: '980px', fontSize: '12px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            background: phaseGradient, color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>{session.phase}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{currentPhase.duration} min</span>
        </div>

        {/* Instructions card */}
        <div className="card glass-strong" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p style={{ fontSize: '20px', color: 'var(--text-primary)', lineHeight: 1.5, letterSpacing: '-0.025em', fontWeight: 500 }}>
            {task.instructions}
          </p>
        </div>

        {/* Input */}
        {!submitted ? (
          <div>
            {task.inputType === 'multiple_choice' && task.options ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {task.options.map(option => (
                  <button key={option} onClick={() => setSelectedOption(option)} style={{
                    width: '100%', textAlign: 'left', padding: '18px 20px',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${selectedOption === option ? 'var(--accent)' : 'var(--divider)'}`,
                    background: selectedOption === option ? 'rgba(0,113,227,0.06)' : 'var(--surface-raised)',
                    color: 'var(--text-primary)', fontSize: '17px', fontFamily: 'inherit',
                    letterSpacing: '-0.022em', cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    outline: 'none'
                  }}>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="card glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '20px' }}>
                <textarea
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); socket?.emit('student:activity') }}
                  placeholder="Write your answer here…"
                  rows={6}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '19px', color: 'var(--text-primary)', fontFamily: 'inherit',
                    letterSpacing: '-0.022em', lineHeight: 1.55, resize: 'none'
                  }}
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={task.inputType === 'multiple_choice' ? !selectedOption : !answer.trim()}
              className="btn-primary"
              style={{
                width: '100%', marginTop: '16px', fontSize: '19px', padding: '18px',
                borderRadius: 'var(--radius-lg)', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,113,227,0.3)'
              }}
            >
              Submit answer
            </button>
          </div>
        ) : (
          <div className="card" style={{
            borderRadius: 'var(--radius-xl)', textAlign: 'center', padding: '32px 24px',
            background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.2)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
            <p style={{ fontWeight: 700, fontSize: '20px', color: 'var(--green)', letterSpacing: '-0.025em', marginBottom: '6px' }}>Submitted!</p>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em' }}>Your teacher can see your answer. Wait for the next phase.</p>
          </div>
        )}
      </main>

      <HintOverlay hints={hints} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
