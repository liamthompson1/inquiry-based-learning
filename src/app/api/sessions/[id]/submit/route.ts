import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session-store'
import { evaluateSubmission } from '@/lib/agent/pulse'
import { generateHint } from '@/lib/agent/scaffold'
import type { Submission } from '@/lib/types'

export const maxDuration = 30

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { studentId, taskId, type, content } = await request.json()

    const session = await getSession(id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const student = session.students.find(s => s.id === studentId)
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const submission: Submission = { taskId, type, content, submittedAt: new Date().toISOString() }
    student.submissions.push(submission)
    student.lastActivity = new Date().toISOString()

    // Save immediately so teacher sees the submission
    await setSession(session)

    // AI evaluation — runs inline, result updates session again
    try {
      const { evaluation, flag } = await evaluateSubmission(session, student, submission)
      submission.aiEvaluation = evaluation
      if (flag) student.flags.push(flag)

      if (evaluation.understanding === 'struggling') {
        const hintText = await generateHint(submission, session.lesson.rubric, student.name, 'struggling')
        student.hints.push({ content: hintText, from: 'ai', reason: 'struggling', timestamp: new Date().toISOString() })
      }

      await setSession(session)
    } catch (aiErr) {
      console.error('AI evaluation failed:', aiErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
