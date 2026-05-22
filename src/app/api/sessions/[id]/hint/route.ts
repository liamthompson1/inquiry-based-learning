import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session-store'

export const maxDuration = 15

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { studentId, hint } = await request.json()

    const session = await getSession(id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const student = session.students.find(s => s.id === studentId)
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    student.hints.push({ content: hint, from: 'teacher', timestamp: new Date().toISOString() })
    await setSession(session)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Hint error:', err)
    return NextResponse.json({ error: 'Failed to send hint' }, { status: 500 })
  }
}
