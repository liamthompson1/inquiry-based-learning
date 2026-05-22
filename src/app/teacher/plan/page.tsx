'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LessonPlan } from '@/lib/types'

const PHASE_LABELS: Record<string, string> = {
  engage: 'Engage',
  explore: 'Explore',
  explain: 'Explain',
  elaborate: 'Elaborate',
  evaluate: 'Evaluate'
}

export default function LessonPlannerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    topic: '',
    gradeLevel: 'Primary 4',
    objectives: '',
    duration: 60
  })
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<LessonPlan | null>(null)
  const [launchLoading, setLaunchLoading] = useState(false)
  const [teacherName, setTeacherName] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setPlan(null)
    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const { plan } = await res.json()
      setPlan(plan)
    } finally {
      setLoading(false)
    }
  }

  async function handleLaunch() {
    if (!plan || !teacherName) return
    setLaunchLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: plan, teacherName })
      })
      const { session } = await res.json()
      router.push(`/teacher/session/${session.id}`)
    } finally {
      setLaunchLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-6 py-4">
        <h1 className="text-xl font-bold">Inquire.ai</h1>
        <p className="text-indigo-200 text-xs">Lesson Planner</p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Input form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Plan a new lesson</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                placeholder="e.g. Magnets and Forces"
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade Level</label>
              <select
                value={form.gradeLevel}
                onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'].map(g => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Learning Objectives</label>
            <textarea
              placeholder="e.g. Students will understand magnetic poles and predict attraction/repulsion"
              value={form.objectives}
              onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
              min={20}
              max={120}
              step={5}
              className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!form.topic || !form.objectives || loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI is designing your lesson…
              </>
            ) : (
              '✨ Generate IBL Lesson Plan'
            )}
          </button>
        </div>

        {/* Generated plan */}
        {plan && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-indigo-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{plan.topic}</h2>
                  <p className="text-slate-500 text-sm">{plan.gradeLevel} · {plan.duration} min · 5E IBL Framework</p>
                </div>
              </div>
              <div className="space-y-1 mb-4">
                {plan.objectives.map((obj, i) => (
                  <div key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-indigo-400">◎</span> {obj}
                  </div>
                ))}
              </div>
            </div>

            {plan.phases.map((phase, i) => (
              <div key={phase.name} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <div>
                    <div className="font-bold text-slate-800">{PHASE_LABELS[phase.name]}</div>
                    <div className="text-xs text-slate-400">{phase.duration} min</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-600 mb-1">Teacher</div>
                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{phase.teacherInstructions}</p>
                  </div>
                  <div>
                    <div className="font-medium text-slate-600 mb-1">Student task ({phase.studentTask.inputType})</div>
                    <p className="text-slate-600 bg-indigo-50 rounded-lg p-3">{phase.studentTask.instructions}</p>
                    {phase.studentTask.options && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {phase.studentTask.options.map((opt, j) => (
                          <span key={j} className="bg-white border border-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded-lg">{opt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Launch */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Ready to launch this session?</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Your name (e.g. Ms Chen)"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleLaunch}
                  disabled={!teacherName || launchLoading}
                  className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {launchLoading ? 'Launching…' : '🚀 Launch Session'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
