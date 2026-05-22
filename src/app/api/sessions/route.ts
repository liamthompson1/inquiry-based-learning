import { NextRequest, NextResponse } from 'next/server'
import { setSession, listSessions } from '@/lib/session-store'
import type { Session, LessonPlan } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  const { lesson, teacherName }: { lesson: LessonPlan; teacherName: string } = await request.json()

  const session: Session = {
    id: uuidv4(),
    pin: generatePin(),
    lessonId: lesson.id,
    lesson,
    teacherName,
    status: 'waiting',
    phase: 'engage',
    students: [],
    createdAt: new Date().toISOString()
  }

  setSession(session)
  return NextResponse.json({ session })
}

export async function GET() {
  return NextResponse.json({ sessions: listSessions() })
}
