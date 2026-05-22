import Anthropic from '@anthropic-ai/sdk'
import type { Session, StudentState, Submission, Flag } from '../types'

const client = new Anthropic()

interface EvaluationResult {
  evaluation: {
    score: number
    understanding: 'strong' | 'partial' | 'struggling'
    notes: string
  }
  flag: Flag | null
}

export async function evaluateSubmission(
  session: Session,
  student: StudentState,
  submission: Submission
): Promise<EvaluationResult> {
  const phase = session.lesson.phases.find(p => p.name === session.phase)
  if (!phase) throw new Error('Phase not found')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are an AI teaching assistant evaluating primary school student responses during an inquiry-based learning lesson.
Be encouraging and constructive. Evaluate responses against the rubric criteria.
Respond with valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Evaluate this student response:

Topic: ${session.lesson.topic}
Phase: ${phase.name}
Task: ${phase.studentTask.instructions}
Rubric criteria: ${phase.studentTask.rubricCriteria.join(', ')}
Strong indicators: ${session.lesson.rubric.strongIndicators.join(', ')}
Struggling indicators: ${session.lesson.rubric.strugglingIndicators.join(', ')}

Student name: ${student.name}
Student response: "${submission.content}"

Return JSON:
{
  "score": number (0-100),
  "understanding": "strong" | "partial" | "struggling",
  "notes": string (brief evaluator note, 1 sentence),
  "flag": {
    "type": "excellent" | "misconception" | "needs_attention",
    "message": string (message for teacher),
    "severity": "low" | "medium" | "high"
  } | null
}`
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  const result = JSON.parse(content.text)

  return {
    evaluation: {
      score: result.score,
      understanding: result.understanding,
      notes: result.notes
    },
    flag: result.flag ? {
      ...result.flag,
      timestamp: new Date().toISOString()
    } : null
  }
}

