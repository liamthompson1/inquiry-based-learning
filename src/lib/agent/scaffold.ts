import Anthropic from '@anthropic-ai/sdk'
import type { Submission, Rubric } from '../types'

const client = new Anthropic()

export async function generateHint(
  submission: Submission,
  rubric: Rubric,
  studentName: string,
  reason: 'struggling' | 'stuck' = 'struggling'
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `You are a kind, encouraging teaching assistant helping primary school students during inquiry-based learning.
Generate a gentle hint that guides thinking without giving the answer directly.
Use age-appropriate language. Be brief (2-3 sentences max).
Avoid using student names in the hint text.`,
    messages: [
      {
        role: 'user',
        content: `Generate a scaffolding hint for a student who is ${reason === 'stuck' ? 'stuck and inactive for 3+ minutes' : 'struggling with the task'}.

Student's response so far: "${submission.content || '(no response yet)'}"
Rubric criteria: ${rubric.criteria.join(', ')}

Write only the hint text, nothing else.`
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text.trim()
}
