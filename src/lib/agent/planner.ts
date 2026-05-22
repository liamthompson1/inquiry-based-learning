import Anthropic from '@anthropic-ai/sdk'
import type { LessonPlan } from '../types'
import { v4 as uuidv4 } from 'uuid'

const client = new Anthropic()

export async function generateLessonPlan(
  topic: string,
  gradeLevel: string,
  objectives: string,
  duration: number
): Promise<LessonPlan> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are an expert primary school teacher designing Inquiry-Based Learning (IBL) lessons aligned with Singapore MOE curriculum standards.
You create engaging, age-appropriate lessons that foster 21st-century competencies: critical thinking, creative inquiry, and collaborative learning.
Always follow the 5E IBL framework: Engage, Explore, Explain, Elaborate, Evaluate.
Respond with valid JSON only, no markdown.`,
    messages: [
      {
        role: 'user',
        content: `Create a complete IBL lesson plan for:
Topic: ${topic}
Grade Level: ${gradeLevel}
Learning Objectives: ${objectives}
Duration: ${duration} minutes

Return a JSON object with this exact structure:
{
  "gradeLevel": string,
  "objectives": string[],
  "phases": [
    {
      "name": "engage" | "explore" | "explain" | "elaborate" | "evaluate",
      "duration": number (minutes),
      "teacherInstructions": string (what the teacher does/says),
      "studentTask": {
        "id": string (uuid),
        "instructions": string (clear instructions shown on iPad),
        "inputType": "text" | "multiple_choice",
        "options": string[] | null (only if multiple_choice),
        "hintProgression": string[] (3 progressive hints, least to most specific),
        "rubricCriteria": string[] (2-3 criteria for evaluating response quality)
      }
    }
  ],
  "rubric": {
    "criteria": string[],
    "strongIndicators": string[] (signs student deeply understands),
    "strugglingIndicators": string[] (signs student is lost or has misconceptions)
  }
}`
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const parsed = JSON.parse(content.text)
  return {
    id: uuidv4(),
    topic,
    gradeLevel: parsed.gradeLevel,
    objectives: parsed.objectives,
    duration,
    phases: parsed.phases,
    rubric: parsed.rubric,
    createdAt: new Date().toISOString()
  }
}
