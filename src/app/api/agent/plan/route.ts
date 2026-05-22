import { NextRequest, NextResponse } from 'next/server'
import { generateLessonPlan } from '@/lib/agent/planner'

export async function POST(request: NextRequest) {
  try {
    const { topic, gradeLevel, objectives, duration } = await request.json()
    if (!topic || !gradeLevel || !objectives) {
      return NextResponse.json({ error: 'topic, gradeLevel, objectives required' }, { status: 400 })
    }
    const plan = await generateLessonPlan(topic, gradeLevel, objectives, duration ?? 60)
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json({ error: 'Failed to generate lesson plan' }, { status: 500 })
  }
}
