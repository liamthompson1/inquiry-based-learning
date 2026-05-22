'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { LessonPlan } from '@/lib/types'

export default function TeacherDashboard() {
  const [plans, setPlans] = useState<LessonPlan[]>([])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-xl font-bold">Inquire.ai</h1>
          <p className="text-indigo-200 text-xs">Teacher Dashboard</p>
        </div>
        <Link
          href="/teacher/plan"
          className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
        >
          + New Lesson
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔬</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">No lessons yet</h2>
            <p className="text-slate-500 mb-6">Use the AI planner to create your first IBL lesson in seconds.</p>
            <Link
              href="/teacher/plan"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Create your first lesson →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800">{plan.topic}</div>
                  <div className="text-sm text-slate-400">{plan.gradeLevel} · {plan.duration} min</div>
                </div>
                <Link
                  href={`/teacher/plan?id=${plan.id}`}
                  className="text-indigo-600 font-medium text-sm hover:text-indigo-700"
                >
                  Launch session →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
