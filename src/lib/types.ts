export type PhaseId = 'engage' | 'explore' | 'explain' | 'elaborate' | 'evaluate'
export type InputType = 'text' | 'multiple_choice' | 'photo'
export type Understanding = 'strong' | 'partial' | 'struggling'
export type SessionStatus = 'waiting' | 'active' | 'paused' | 'complete'
export type FlagSeverity = 'low' | 'medium' | 'high'

export interface StudentTask {
  id: string
  instructions: string
  inputType: InputType
  options?: string[]
  hintProgression: string[]
  rubricCriteria: string[]
}

export interface LessonPhase {
  name: PhaseId
  duration: number
  teacherInstructions: string
  studentTask: StudentTask
}

export interface Rubric {
  criteria: string[]
  strongIndicators: string[]
  strugglingIndicators: string[]
}

export interface LessonPlan {
  id: string
  topic: string
  gradeLevel: string
  objectives: string[]
  duration: number
  phases: LessonPhase[]
  rubric: Rubric
  createdAt: string
}

export interface Submission {
  taskId: string
  type: InputType
  content: string
  submittedAt: string
  aiEvaluation?: {
    score: number
    understanding: Understanding
    notes: string
  }
}

export interface Flag {
  type: 'stuck' | 'misconception' | 'needs_attention' | 'excellent'
  message: string
  severity: FlagSeverity
  timestamp: string
}

export interface Hint {
  content: string
  from: 'ai' | 'teacher'
  reason?: string
  timestamp: string
}

export interface StudentState {
  id: string
  name: string
  phase: PhaseId
  submissions: Submission[]
  lastActivity: string
  flags: Flag[]
  hints: Hint[]
  isActive: boolean
}

export interface Session {
  id: string
  pin: string
  lessonId: string
  lesson: LessonPlan
  teacherName: string
  status: SessionStatus
  phase: PhaseId
  students: StudentState[]
  createdAt: string
}

export interface PulseCluster {
  strong: StudentState[]
  partial: StudentState[]
  struggling: StudentState[]
  notStarted: StudentState[]
}

export interface PostLessonReport {
  sessionId: string
  topic: string
  duration: number
  studentCount: number
  classMastery: number
  clusters: {
    strong: string[]
    partial: string[]
    struggling: string[]
  }
  insights: string[]
  knowledgeGaps: string[]
  suggestedFollowUp: string[]
  generatedAt: string
}
