import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/agent/report'
import { getSession } from '@/lib/session-store'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    const session = getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const report = await generateReport(session)
    return NextResponse.json({ report })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
