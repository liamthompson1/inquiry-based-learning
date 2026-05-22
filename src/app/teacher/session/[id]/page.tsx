'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useSocket } from '@/lib/socket/client'
import StudentCard from '@/components/teacher/StudentCard'
import PhaseNav from '@/components/teacher/PhaseNav'
import type { Session, StudentState, Flag, PhaseId } from '@/lib/types'
import { clusterStudents } from '@/lib/pulse-utils'
import Link from 'next/link'

export default function PulseDashboard() {
  const { id } = useParams<{ id: string }>()
  const { socket, connected } = useSocket()
  const [session, setSession] = useState<Session | null>(null)
  const [flagLog, setFlagLog] = useState<Array<{ student: StudentState; flag: Flag }>>([])
  const [hintModal, setHintModal] = useState<{ socketId: string; name: string } | null>(null)
  const [hintText, setHintText] = useState('')

  useEffect(() => {
    fetch(`/api/sessions/${id}`).then(r => r.json()).then(({ session }) => setSession(session))
  }, [id])

  useEffect(() => {
    if (!socket || !id) return
    socket.emit('teacher:join', { sessionId: id })
    socket.on('session:state', (s: Session) => setSession(s))
    socket.on('student:connected', ({ student }: { student: StudentState }) => {
      setSession(prev => prev ? { ...prev, students: [...prev.students, student] } : prev)
    })
    socket.on('student:disconnected', ({ socketId }: { socketId: string }) => {
      setSession(prev => prev ? { ...prev, students: prev.students.filter(s => s.socketId !== socketId) } : prev)
    })
    socket.on('pulse:update', ({ student }: { student: StudentState }) => {
      setSession(prev => {
        if (!prev) return prev
        return { ...prev, students: prev.students.map(s => s.socketId === student.socketId ? student : s) }
      })
    })
    socket.on('student:flagged', ({ student, flag }: { student: StudentState; flag: Flag }) => {
      setFlagLog(prev => [{ student, flag }, ...prev].slice(0, 20))
      setSession(prev => {
        if (!prev) return prev
        return { ...prev, students: prev.students.map(s => s.socketId === student.socketId ? student : s) }
      })
    })
    socket.on('phase:changed', ({ phase }: { phase: PhaseId }) => {
      setSession(prev => prev ? { ...prev, phase } : prev)
    })
    return () => {
      socket.off('session:state'); socket.off('student:connected'); socket.off('student:disconnected')
      socket.off('pulse:update'); socket.off('student:flagged'); socket.off('phase:changed')
    }
  }, [socket, id])

  const handleAdvancePhase = useCallback(() => {
    socket?.emit('teacher:advance_phase', { sessionId: id })
  }, [socket, id])

  const handleSendHint = useCallback((socketId: string) => {
    const student = session?.students.find(s => s.socketId === socketId)
    if (!student) return
    setHintModal({ socketId, name: student.name })
    setHintText('')
  }, [session])

  const handleSubmitHint = useCallback(() => {
    if (!hintModal || !hintText.trim()) return
    socket?.emit('teacher:push_hint', { sessionId: id, studentSocketId: hintModal.socketId, hint: { content: hintText, from: 'teacher', timestamp: new Date().toISOString() } })
    setHintModal(null)
  }, [socket, id, hintModal, hintText])

  const handleActivate = useCallback(async () => {
    await fetch(`/api/sessions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) })
    setSession(prev => prev ? { ...prev, status: 'active' } : prev)
  }, [id])

  if (!session) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const clusters = clusterStudents(session.students)
  const currentPhase = session.lesson.phases.find(p => p.name === session.phase)

  const summaryItems = [
    { label: 'Strong', count: clusters.strong.length, color: 'var(--green)' },
    { label: 'Partial', count: clusters.partial.length, color: 'var(--amber)' },
    { label: 'Struggling', count: clusters.struggling.length, color: 'var(--red)' },
    { label: 'Not started', count: clusters.notStarted.length, color: 'rgba(255,255,255,0.3)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a0f 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '10%', width: '40%', height: '40%', background: 'radial-gradient(ellipse, rgba(0,113,227,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '35%', height: '35%', background: 'radial-gradient(ellipse, rgba(191,90,242,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <header className="glass-dark" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '17px', color: 'white', letterSpacing: '-0.022em' }}>{session.lesson.topic}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{session.lesson.gradeLevel}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>PIN {session.pin}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{session.students.length} students</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: connected ? 'var(--green)' : 'var(--red)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {session.status === 'waiting' && (
              <button onClick={handleActivate} style={{
                padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 600,
                background: 'var(--green)', color: 'white', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.008em'
              }}>
                Open session
              </button>
            )}
            <Link href={`/teacher/review/${id}`} style={{
              padding: '8px 18px', borderRadius: '980px', fontSize: '13px',
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none',
              letterSpacing: '-0.008em', fontFamily: 'inherit'
            }}>
              End & report
            </Link>
          </div>
        </div>
        <PhaseNav currentPhase={session.phase} onAdvance={handleAdvancePhase} disabled={session.status !== 'active'} />
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Main area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Teacher instruction */}
          {currentPhase && (
            <div style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Your role · {session.phase}
              </div>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.016em', lineHeight: 1.5 }}>{currentPhase.teacherInstructions}</p>
            </div>
          )}

          {/* Pulse summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
            {summaryItems.map(({ label, count, color }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 'var(--radius-lg)', padding: '14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'white', letterSpacing: '-0.04em' }}>{count}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.008em' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Student grid */}
          {session.students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
              <p style={{ fontSize: '17px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.022em', marginBottom: '8px' }}>Waiting for students</p>
              <p style={{ fontSize: '15px', letterSpacing: '-0.016em' }}>Share the PIN: <strong style={{ fontFamily: 'monospace', fontSize: '20px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>{session.pin}</strong></p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {session.students.map(student => (
                <StudentCard key={student.socketId} student={student} onPushHint={handleSendHint} onWalkOver={() => {}} />
              ))}
            </div>
          )}
        </main>

        {/* Alerts sidebar */}
        <aside style={{
          width: '260px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)',
          padding: '16px', overflowY: 'auto'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>AI Alerts</div>
          {flagLog.length === 0
            ? <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.008em', lineHeight: 1.5 }}>No alerts yet. AI will surface key moments here.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {flagLog.map(({ student, flag }, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    background: flag.severity === 'high' ? 'rgba(255,69,58,0.12)' : 'rgba(255,159,10,0.08)',
                    border: `1px solid ${flag.severity === 'high' ? 'rgba(255,69,58,0.25)' : 'rgba(255,159,10,0.15)'}`,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'white', letterSpacing: '-0.008em', marginBottom: '2px' }}>{student.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.008em' }}>{flag.message}</div>
                  </div>
                ))}
              </div>
          }
        </aside>
      </div>

      {/* Hint modal */}
      {hintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '4px', color: 'var(--text-primary)' }}>Send hint to {hintModal.name}</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', marginBottom: '16px' }}>This will appear as a notification on their screen.</p>
            <textarea className="input" value={hintText} onChange={e => setHintText(e.target.value)}
              placeholder="Try thinking about what you know about…" rows={3}
              style={{ resize: 'none', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={() => setHintModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitHint} disabled={!hintText.trim()} style={{ flex: 1 }}>Send hint</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
