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
    fetch(`/api/sessions/${id}`)
      .then(r => r.json())
      .then(({ session }) => setSession(session))
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
        return {
          ...prev,
          students: prev.students.map(s => s.socketId === student.socketId ? student : s)
        }
      })
    })

    socket.on('student:flagged', ({ student, flag }: { student: StudentState; flag: Flag }) => {
      setFlagLog(prev => [{ student, flag }, ...prev].slice(0, 20))
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          students: prev.students.map(s => s.socketId === student.socketId ? student : s)
        }
      })
    })

    socket.on('phase:changed', ({ phase }: { phase: PhaseId }) => {
      setSession(prev => prev ? { ...prev, phase } : prev)
    })

    return () => {
      socket.off('session:state')
      socket.off('student:connected')
      socket.off('student:disconnected')
      socket.off('pulse:update')
      socket.off('student:flagged')
      socket.off('phase:changed')
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
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' })
    })
    setSession(prev => prev ? { ...prev, status: 'active' } : prev)
  }, [id])

  if (!session) return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  const clusters = clusterStudents(session.students)
  const currentPhase = session.lesson.phases.find(p => p.name === session.phase)

  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-900/80 backdrop-blur-sm border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-bold text-lg">{session.lesson.topic}</h1>
            <div className="flex items-center gap-3 text-indigo-200 text-xs mt-0.5">
              <span>{session.lesson.gradeLevel}</span>
              <span>·</span>
              <span>PIN: <strong className="text-white font-mono text-sm tracking-widest">{session.pin}</strong></span>
              <span>·</span>
              <span>{session.students.length} students</span>
              <span>·</span>
              <span className={`flex items-center gap-1 ${connected ? 'text-emerald-300' : 'text-red-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.status === 'waiting' && (
              <button
                onClick={handleActivate}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Open Session
              </button>
            )}
            <Link
              href={`/teacher/review/${id}`}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              End & Report
            </Link>
          </div>
        </div>
        <PhaseNav
          currentPhase={session.phase}
          onAdvance={handleAdvancePhase}
          disabled={session.status !== 'active'}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main pulse grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Teacher instructions for current phase */}
          {currentPhase && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-5 text-sm text-indigo-100">
              <div className="font-semibold text-white mb-1">Your role in {session.phase}</div>
              {currentPhase.teacherInstructions}
            </div>
          )}

          {/* Pulse summary */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Strong', count: clusters.strong.length, color: 'bg-emerald-500' },
              { label: 'Partial', count: clusters.partial.length, color: 'bg-amber-400' },
              { label: 'Struggling', count: clusters.struggling.length, color: 'bg-red-500' },
              { label: 'Not started', count: clusters.notStarted.length, color: 'bg-slate-400' }
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className={`text-2xl font-bold text-white`}>{count}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-indigo-200 text-xs">{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Student grid */}
          {session.students.length === 0 ? (
            <div className="text-center py-16 text-indigo-200">
              <div className="text-4xl mb-3">📱</div>
              <p className="text-lg font-medium">Waiting for students to join</p>
              <p className="text-sm mt-1">Share the PIN: <strong className="text-white font-mono text-xl tracking-widest">{session.pin}</strong></p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {session.students.map(student => (
                <StudentCard
                  key={student.socketId}
                  student={student}
                  onPushHint={handleSendHint}
                  onWalkOver={() => {}}
                />
              ))}
            </div>
          )}
        </main>

        {/* Flag log sidebar */}
        <aside className="w-72 bg-indigo-950/50 border-l border-white/10 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold text-sm mb-3">AI Alerts</h3>
          {flagLog.length === 0 ? (
            <p className="text-indigo-300/60 text-xs">No flags yet. The AI will surface key moments here.</p>
          ) : (
            <div className="space-y-2">
              {flagLog.map(({ student, flag }, i) => (
                <div key={i} className={`rounded-lg p-3 text-xs ${flag.severity === 'high' ? 'bg-red-900/50 border border-red-500/30' : 'bg-amber-900/30 border border-amber-500/20'}`}>
                  <div className="font-semibold text-white">{student.name}</div>
                  <div className="text-indigo-200 mt-0.5">{flag.message}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Hint modal */}
      {hintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">Send hint to {hintModal.name}</h3>
            <p className="text-slate-500 text-sm mb-4">This will appear as a notification on their iPad.</p>
            <textarea
              value={hintText}
              onChange={e => setHintText(e.target.value)}
              placeholder="Try thinking about what you know about magnetic poles…"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setHintModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSubmitHint} disabled={!hintText.trim()} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
