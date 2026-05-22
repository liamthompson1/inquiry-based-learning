'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Waiting',
  active: 'Live',
  paused: 'Paused',
  complete: 'Complete',
}
const STATUS_COLOR: Record<string, string> = {
  waiting: 'rgba(255,255,255,0.4)',
  active: 'var(--green)',
  paused: 'var(--amber)',
  complete: 'var(--text-tertiary)',
}
const PHASE_LABEL: Record<string, string> = {
  engage: 'Engage', explore: 'Explore', explain: 'Explain',
  elaborate: 'Elaborate', evaluate: 'Evaluate',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TeacherDashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(({ sessions }) => setSessions(sessions ?? []))
      .finally(() => setLoading(false))
  }, [])

  const live = sessions.filter(s => s.status === 'active' || s.status === 'waiting' || s.status === 'paused')
  const past = sessions.filter(s => s.status === 'complete')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <nav className="nav-glass" style={{ padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.022em', background: 'linear-gradient(135deg, #0071e3, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inquire.ai</span>
          <span style={{ color: 'var(--divider)', fontSize: '20px', fontWeight: 300 }}>/</span>
          <span style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em' }}>Teacher</span>
        </div>
        <Link href="/teacher/plan" className="btn-primary" style={{ fontSize: '15px', padding: '8px 18px' }}>
          New lesson
        </Link>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--divider)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="animate-fade-up" style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(0,113,227,0.1), rgba(191,90,242,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 24px'
            }}>🔬</div>
            <h1 className="headline-md" style={{ marginBottom: '12px' }}>Welcome to Inquire.ai</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '17px', letterSpacing: '-0.022em', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.5 }}>
              Create your first AI-generated IBL lesson. The 5E framework, student tasks, and rubrics — all done in seconds.
            </p>
            <Link href="/teacher/plan" className="btn-primary">Create your first lesson</Link>
          </div>
        ) : (
          <div className="animate-fade-up">
            {live.length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Active sessions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {live.map(s => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Past lessons
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {past.map(s => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  const isLive = session.status === 'active' || session.status === 'waiting' || session.status === 'paused'
  const statusColor = STATUS_COLOR[session.status]

  return (
    <div className="card" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      padding: '16px 20px',
      ...(isLive ? { border: '1px solid rgba(0,113,227,0.2)', background: 'rgba(0,113,227,0.02)' } : {}),
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '-0.022em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.lesson.topic}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: statusColor, flexShrink: 0 }}>
            {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0, animation: session.status === 'active' ? 'pulse 2s ease-in-out infinite' : undefined }} />}
            {STATUS_LABEL[session.status]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-tertiary)', letterSpacing: '-0.008em' }}>
          <span>{session.lesson.gradeLevel}</span>
          <span>·</span>
          <span>{session.students.length} student{session.students.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{PHASE_LABEL[session.phase]} phase</span>
          <span>·</span>
          <span>{formatDate(session.createdAt)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {isLive ? (
          <Link href={`/teacher/session/${session.id}`} style={{
            padding: '7px 16px', borderRadius: '980px', fontSize: '13px', fontWeight: 600,
            background: 'var(--accent)', color: 'white', textDecoration: 'none',
            letterSpacing: '-0.008em', fontFamily: 'inherit'
          }}>
            {session.status === 'waiting' ? 'Open' : 'Continue'}
          </Link>
        ) : (
          <Link href={`/teacher/review/${session.id}`} style={{
            padding: '7px 16px', borderRadius: '980px', fontSize: '13px',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
            border: '1px solid var(--divider)', textDecoration: 'none',
            letterSpacing: '-0.008em', fontFamily: 'inherit'
          }}>
            View report
          </Link>
        )}
      </div>
    </div>
  )
}
