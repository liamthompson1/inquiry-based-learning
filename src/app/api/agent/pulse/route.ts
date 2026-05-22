import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
import { evaluateSubmission } from '@/lib/agent/pulse'
import type { Session, StudentState, Submission } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { session, studentSocketId, submission }: {
      session: Session
      studentSocketId: string
      submission: Submission
    } = await request.json()

    const student = session.students.find((s: StudentState) => s.socketId === studentSocketId)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const result = await evaluateSubmission(session, student, submission)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pulse evaluation error:', error)
    return NextResponse.json({ error: 'Failed to evaluate submission' }, { status: 500 })
  }
}
