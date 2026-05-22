import Anthropic from '@anthropic-ai/sdk'
import type { Session, PostLessonReport } from '../types'

const client = new Anthropic()

export async function generateReport(session: Session): Promise<PostLessonReport> {
  const studentSummaries = session.students.map(s => ({
    name: s.name,
    submissions: s.submissions.map(sub => ({
      phase: sub.taskId,
      content: sub.content,
      evaluation: sub.aiEvaluation
    })),
    flags: s.flags
  }))

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert educational analyst generating post-lesson reports for IBL sessions.
Focus on actionable insights for the teacher and identify patterns across the class.
Be specific and constructive. Respond with valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Generate a post-lesson report for this IBL session:

Topic: ${session.lesson.topic}
Grade: ${session.lesson.gradeLevel}
Students: ${session.students.length}
Student data: ${JSON.stringify(studentSummaries, null, 2)}

Return JSON:
{
  "classMastery": number (0-100, percentage of students with strong understanding),
  "clusters": {
    "strong": string[] (student names),
    "partial": string[] (student names),
    "struggling": string[] (student names)
  },
  "insights": string[] (3-5 key insights about the class performance),
  "knowledgeGaps": string[] (2-3 specific gaps or misconceptions observed),
  "suggestedFollowUp": string[] (2-3 specific follow-up activities or topics)
}`
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  const result = JSON.parse(content.text)

  return {
    sessionId: session.id,
    topic: session.lesson.topic,
    duration: session.lesson.duration,
    studentCount: session.students.length,
    classMastery: result.classMastery,
    clusters: result.clusters,
    insights: result.insights,
    knowledgeGaps: result.knowledgeGaps,
    suggestedFollowUp: result.suggestedFollowUp,
    generatedAt: new Date().toISOString()
  }
}
