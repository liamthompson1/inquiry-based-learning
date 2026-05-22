import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 120

const client = new Anthropic()

const SYSTEM = `You are an expert primary school teacher designing Inquiry-Based Learning (IBL) lessons aligned with Singapore MOE curriculum standards.
You create engaging, age-appropriate lessons that foster 21st-century competencies: critical thinking, creative inquiry, and collaborative learning.
Always follow the 5E IBL framework: Engage, Explore, Explain, Elaborate, Evaluate.
Respond with valid JSON only — no markdown, no code fences, no explanation. Just the JSON object.`

function buildPrompt(topic: string, gradeLevel: string, objectives: string, duration: number) {
  return `Create a complete IBL lesson plan for:
Topic: ${topic}
Grade Level: ${gradeLevel}
Learning Objectives: ${objectives}
Duration: ${duration} minutes

Return ONLY a raw JSON object with this structure (no markdown, no backticks):
{
  "gradeLevel": string,
  "objectives": string[],
  "phases": [
    {
      "name": "engage" | "explore" | "explain" | "elaborate" | "evaluate",
      "duration": number,
      "teacherInstructions": string,
      "studentTask": {
        "id": string (a uuid v4),
        "instructions": string,
        "inputType": "text" | "multiple_choice",
        "options": string[] | null,
        "hintProgression": string[],
        "rubricCriteria": string[]
      }
    }
  ],
  "rubric": {
    "criteria": string[],
    "strongIndicators": string[],
    "strugglingIndicators": string[]
  }
}`
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.topic || !body?.objectives) {
    return new Response(JSON.stringify({ error: 'topic and objectives required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { topic, gradeLevel = 'Primary 4', objectives, duration = 60 } = body
  const id = uuidv4()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = ''

        const anthropicStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: SYSTEM,
          messages: [{ role: 'user', content: buildPrompt(topic, gradeLevel, objectives, duration) }]
        })

        for await (const event of anthropicStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text
            // Stream raw text so UI can show live progress
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        // Send the final parsed plan as a sentinel event
        const jsonText = fullText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
        const parsed = JSON.parse(jsonText)
        const plan = {
          id,
          topic,
          gradeLevel: parsed.gradeLevel ?? gradeLevel,
          objectives: parsed.objectives ?? [objectives],
          duration,
          phases: parsed.phases,
          rubric: parsed.rubric,
          createdAt: new Date().toISOString()
        }

        // Sentinel: send the complete plan object on a new line prefixed with \x00PLAN\x00
        controller.enqueue(encoder.encode('\x00PLAN\x00' + JSON.stringify(plan)))
        controller.close()
      } catch (err) {
        console.error('Plan stream error:', err)
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode('\x00ERROR\x00' + msg))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no'
    }
  })
}
