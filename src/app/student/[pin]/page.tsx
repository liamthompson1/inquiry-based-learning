'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import HintOverlay from '@/components/student/HintOverlay'
import type { Session, LessonPhase } from '@/lib/types'

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

  const [session, setSession] = useState<Session | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')
  const [connected, setConnected] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Join session
  useEffect(() => {
    fetch('/api/sessions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, name })
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setJoinError(d.error); return }
        setSession(d.session)
        setStudentId(d.studentId)
      })
      .catch(() => setJoinError('Network error. Please try again.'))
  }, [pin, name])

  // Subscribe to Realtime once we have a session ID
  useEffect(() => {
    if (!session?.id) return
    const sessionId = session.id
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`classroom-student-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const s = (payload.new as { data: Session }).data
          if (s) setSession(s)
        }
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [session?.id])

  // Reset state when phase changes
  useEffect(() => {
    setSubmitted(false)
    setAnswer('')
    setSelectedOption(null)
  }, [session?.phase])

  const myStudent = studentId ? session?.students.find(s => s.id === studentId) : null
  const hints = myStudent?.hints ?? []
  const currentPhase: LessonPhase | null = session?.lesson.phases.find(p => p.name === session.phase) ?? null

  const handleSubmit = useCallback(async () => {
    if (!session || !currentPhase || !studentId) return
    const content = currentPhase.studentTask.inputType === 'multiple_choice'
      ? selectedOption ?? ''
      : answer
    if (!content.trim()) return

    setSubmitted(true)
    fetch(`/api/sessions/${session.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, taskId: currentPhase.studentTask.id, type: currentPhase.studentTask.inputType, content })
    }).catch(console.error)
  }, [session, currentPhase, studentId, answer, selectedOption])

  if (joinError) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '360px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✕</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '8px' }}>Can&apos;t join class</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{joinError}</p>
        <a href="/student" className="btn-primary" style={{ display: 'inline-flex' }}>Try again</a>
      </div>
    </div>
  )

  if (!session || !currentPhase) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--divider)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', letterSpacing: '-0.022em' }}>Joining class…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (session.status === 'paused') return (
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
            <div style={{ fontSize: '11px', color: connected ? 'rgba(255,255,255,0.8)' : 'rgba(255,100,100,0.9)' }}>
              {connected ? '● Live' : '○ Connecting'}
            </div>
          </div>
          {hints.length > 0 && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
            }}>💡</div>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            padding: '4px 14px', borderRadius: '980px', fontSize: '12px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            background: phaseGradient, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>{session.phase}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{currentPhase.duration} min</span>
        </div>

        <div className="card glass-strong" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p style={{ fontSize: '20px', color: 'var(--text-primary)', lineHeight: 1.5, letterSpacing: '-0.025em', fontWeight: 500 }}>
            {task.instructions}
          </p>
        </div>

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
                    transition: 'border-color 0.2s, background 0.2s', outline: 'none'
                  }}>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="card glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '20px' }}>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
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
