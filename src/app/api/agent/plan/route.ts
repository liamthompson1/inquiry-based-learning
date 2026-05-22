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

// Try models in priority order; fall back on overload
const MODEL_FALLBACKS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001']

async function streamPlan(
  model: string,
  topic: string,
  gradeLevel: string,
  objectives: string,
  duration: number
) {
  return client.messages.stream({
    model,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildPrompt(topic, gradeLevel, objectives, duration) }]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.topic || !body?.objectives) {
    return new Response(JSON.stringify({ error: 'topic and objectives required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  const { topic, gradeLevel = 'Primary 4', objectives, duration = 60 } = body
  const id = uuidv4()
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text))

      for (let attempt = 0; attempt < MODEL_FALLBACKS.length; attempt++) {
        const model = MODEL_FALLBACKS[attempt]
        const isFallback = attempt > 0

        try {
          if (isFallback) {
            // Clear any partial output and signal the model switch
            send('\x00RETRY\x00Switching to backup model…\n')
          }

          let fullText = ''
          const anthropicStream = await streamPlan(model, topic, gradeLevel, objectives, duration)

          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullText += event.delta.text
              send(event.delta.text)
            }
          }

          // Strip markdown fences if Claude ignored the instruction
          const jsonText = fullText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim()

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

          send('\x00PLAN\x00' + JSON.stringify(plan))
          controller.close()
          return

        } catch (err: unknown) {
          const isOverloaded =
            (err instanceof Anthropic.APIError && (err.status === 529 || err.error?.type === 'overloaded_error')) ||
            (err instanceof Error && err.message.toLowerCase().includes('overload'))

          if (isOverloaded && attempt < MODEL_FALLBACKS.length - 1) {
            // Retry with next model
            continue
          }

          // Unrecoverable — send a clean human-readable error
          console.error('Plan generation failed:', err)
          const msg = isOverloaded
            ? 'Claude is overloaded right now. Please try again in a moment.'
            : err instanceof Error
              ? err.message
              : 'An unexpected error occurred.'

          send('\x00ERROR\x00' + msg)
          controller.close()
          return
        }
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no'
    }
  })
}
