'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useSocket } from '@/lib/socket/client'
import HintOverlay from '@/components/student/HintOverlay'
import type { Session, StudentState, Hint, PhaseId, LessonPhase } from '@/lib/types'

export default function StudentMissionPage() {
  const { pin } = useParams<{ pin: string }>()
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || 'Student'
  const { socket, connected } = useSocket()

  const [session, setSession] = useState<Session | null>(null)
  const [student, setStudent] = useState<StudentState | null>(null)
  const [currentPhase, setCurrentPhase] = useState<LessonPhase | null>(null)
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [hints, setHints] = useState<Hint[]>([])
  const [error, setError] = useState('')
  const [paused, setPaused] = useState(false)

  // Join session
  useEffect(() => {
    if (!socket || !pin) return

    socket.emit('student:join', { pin, name })

    socket.on('session:joined', ({ session: s, student: st }: { session: Session; student: StudentState }) => {
      setSession(s)
      setStudent(st)
      const phase = s.lesson.phases.find(p => p.name === s.phase)
      setCurrentPhase(phase ?? null)
    })

    socket.on('error', ({ message }: { message: string }) => {
      setError(message)
    })

    socket.on('hint:push', ({ hint }: { hint: Hint }) => {
      setHints(prev => [...prev, hint])
    })

    socket.on('phase:changed', ({ phase }: { phase: PhaseId }) => {
      setSession(prev => prev ? { ...prev, phase } : prev)
      if (session) {
        const newPhase = session.lesson.phases.find(p => p.name === phase)
        setCurrentPhase(newPhase ?? null)
        setSubmitted(false)
        setAnswer('')
        setSelectedOption(null)
      }
    })

    socket.on('session:paused', () => setPaused(true))
    socket.on('session:resumed', () => setPaused(false))

    return () => {
      socket.off('session:joined')
      socket.off('error')
      socket.off('hint:push')
      socket.off('phase:changed')
      socket.off('session:paused')
      socket.off('session:resumed')
    }
  }, [socket, pin, name, session])

  // Activity heartbeat
  useEffect(() => {
    if (!socket || !student) return
    const interval = setInterval(() => {
      socket.emit('student:activity')
    }, 30000)
    return () => clearInterval(interval)
  }, [socket, student])

  const handleSubmit = useCallback(() => {
    if (!socket || !currentPhase) return
    const content = currentPhase.studentTask.inputType === 'multiple_choice'
      ? selectedOption ?? ''
      : answer
    if (!content.trim()) return

    socket.emit('student:submit', {
      taskId: currentPhase.studentTask.id,
      type: currentPhase.studentTask.inputType,
      content
    })
    setSubmitted(true)
  }, [socket, currentPhase, answer, selectedOption])

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Can&apos;t join class</h2>
        <p className="text-slate-500">{error}</p>
        <a href="/student" className="mt-4 inline-block text-indigo-600 font-medium">Try again</a>
      </div>
    </div>
  )

  if (!session || !currentPhase) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: '3px' }} />
        <p className="font-medium">{session ? 'Loading your mission…' : 'Joining class…'}</p>
      </div>
    </div>
  )

  if (paused) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center p-6">
      <div className="text-center text-white">
        <div className="text-5xl mb-4">⏸️</div>
        <h2 className="text-2xl font-bold mb-2">Class paused</h2>
        <p className="text-white/60">Your teacher has paused the session. Please wait.</p>
      </div>
    </div>
  )

  const task = currentPhase.studentTask

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">{session.lesson.topic}</div>
            <div className="text-indigo-200 text-xs capitalize">{session.phase} phase</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{name}</div>
            <div className={`text-xs ${connected ? 'text-emerald-300' : 'text-red-300'}`}>
              {connected ? '● Connected' : '○ Reconnecting'}
            </div>
          </div>
        </div>
      </header>

      {/* Mission card */}
      <main className="flex-1 p-5 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Phase label */}
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            {session.phase}
          </div>
          <div className="text-slate-400 text-xs">{currentPhase.duration} min</div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-indigo-100">
          <p className="text-slate-800 text-lg leading-relaxed font-medium">{task.instructions}</p>
        </div>

        {/* Input */}
        {!submitted ? (
          <div className="bg-white rounded-3xl shadow-md p-5 border border-slate-100">
            {task.inputType === 'multiple_choice' && task.options ? (
              <div className="space-y-3">
                {task.options.map(option => (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all ${
                      selectedOption === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answer}
                onChange={e => {
                  setAnswer(e.target.value)
                  socket?.emit('student:activity')
                }}
                placeholder="Write your answer here…"
                rows={5}
                className="w-full text-slate-800 text-base leading-relaxed resize-none focus:outline-none placeholder:text-slate-300"
              />
            )}
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-bold text-emerald-800">Submitted!</p>
            <p className="text-emerald-600 text-sm mt-1">Your teacher can see your answer. Wait for the next phase.</p>
          </div>
        )}

        {/* Submit button */}
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={task.inputType === 'multiple_choice' ? !selectedOption : !answer.trim()}
            className="w-full bg-indigo-600 text-white font-bold text-lg py-5 rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            Submit my answer →
          </button>
        )}

        {/* Hint count */}
        {hints.length > 0 && (
          <div className="text-center text-indigo-400 text-sm">
            💡 You have {hints.length} hint{hints.length !== 1 ? 's' : ''} — scroll up to see
          </div>
        )}
      </main>

      <HintOverlay hints={hints} />
    </div>
  )
}
