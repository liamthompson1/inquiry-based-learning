import { NextRequest, NextResponse } from 'next/server'
import { findSessionByPin, setSession } from '@/lib/session-store'
import type { StudentState } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 15

export async function POST(request: NextRequest) {
  try {
    const { pin, name } = await request.json()
    if (!pin || !name) {
      return NextResponse.json({ error: 'pin and name required' }, { status: 400 })
    }

    const session = await findSessionByPin(pin)
    if (!session) {
      return NextResponse.json({ error: 'Session not found. Check your PIN.' }, { status: 404 })
    }
    if (session.status === 'complete') {
      return NextResponse.json({ error: 'This session has ended.' }, { status: 410 })
    }

    const studentId = uuidv4()
    const student: StudentState = {
      id: studentId,
      name,
      phase: session.phase,
      submissions: [],
      lastActivity: new Date().toISOString(),
      flags: [],
      hints: [],
      isActive: true
    }

    session.students.push(student)
    await setSession(session)

    return NextResponse.json({ session, studentId })
  } catch (err) {
    console.error('Join error:', err)
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 })
  }
}
