import { NextRequest, NextResponse } from 'next/server'
import { generateHint } from '@/lib/agent/scaffold'
import type { Submission, Rubric } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { submission, rubric, studentName, reason }: {
      submission: Submission
      rubric: Rubric
      studentName: string
      reason?: 'struggling' | 'stuck'
    } = await request.json()

    const hintText = await generateHint(submission, rubric, studentName, reason)
    const hint = {
      content: hintText,
      from: 'ai' as const,
      reason: reason ?? 'struggling',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json({ hint })
  } catch (error) {
    console.error('Scaffold generation error:', error)
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 })
  }
}
