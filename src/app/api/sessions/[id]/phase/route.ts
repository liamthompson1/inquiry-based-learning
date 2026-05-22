import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session-store'
import type { PhaseId } from '@/lib/types'

export const maxDuration = 15

const PHASES: PhaseId[] = ['engage', 'explore', 'explain', 'elaborate', 'evaluate']

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession(id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const idx = PHASES.indexOf(session.phase)
    if (idx < PHASES.length - 1) {
      session.phase = PHASES[idx + 1]
      session.students.forEach(s => { s.phase = session.phase })
      await setSession(session)
    }

    return NextResponse.json({ session })
  } catch (err) {
    console.error('Phase advance error:', err)
    return NextResponse.json({ error: 'Failed to advance phase' }, { status: 500 })
  }
}
