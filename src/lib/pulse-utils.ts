import type { StudentState, PulseCluster } from './types'

export function clusterStudents(students: StudentState[]): PulseCluster {
  const clusters: PulseCluster = {
    strong: [],
    partial: [],
    struggling: [],
    notStarted: []
  }

  for (const student of students) {
    const latest = student.submissions.at(-1)
    if (!latest?.aiEvaluation) {
      clusters.notStarted.push(student)
    } else if (latest.aiEvaluation.understanding === 'strong') {
      clusters.strong.push(student)
    } else if (latest.aiEvaluation.understanding === 'partial') {
      clusters.partial.push(student)
    } else {
      clusters.struggling.push(student)
    }
  }

  return clusters
}
