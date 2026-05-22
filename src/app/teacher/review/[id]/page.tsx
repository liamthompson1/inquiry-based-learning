'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { PostLessonReport } from '@/lib/types'
import Link from 'next/link'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<PostLessonReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id })
      })
      const { report } = await res.json()
      setReport(report)
      setGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="text-indigo-200 hover:text-white text-sm">← Dashboard</Link>
          <span className="text-white/30">/</span>
          <h1 className="font-bold">Post-Lesson Report</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {!generated ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Generate Lesson Report</h2>
            <p className="text-slate-500 mb-6">The AI will analyse all student submissions and produce actionable insights.</p>
            <button
              onClick={generate}
              disabled={loading}
              className="bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analysing class data…
                </>
              ) : '✨ Generate Report'}
            </button>
          </div>
        ) : report ? (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-800 text-lg mb-4">{report.topic}</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-indigo-600">{report.studentCount}</div>
                  <div className="text-xs text-slate-500 mt-1">Students</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-emerald-600">{report.classMastery}%</div>
                  <div className="text-xs text-slate-500 mt-1">Class mastery</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-slate-700">{report.duration}min</div>
                  <div className="text-xs text-slate-500 mt-1">Duration</div>
                </div>
              </div>
            </div>

            {/* Student clusters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Student Understanding</h3>
              <div className="space-y-3">
                {[
                  { label: 'Strong', names: report.clusters.strong, color: 'bg-emerald-100 text-emerald-800' },
                  { label: 'Partial', names: report.clusters.partial, color: 'bg-amber-100 text-amber-800' },
                  { label: 'Struggling', names: report.clusters.struggling, color: 'bg-red-100 text-red-800' }
                ].map(({ label, names, color }) => (
                  names.length > 0 && (
                    <div key={label}>
                      <div className="text-xs font-semibold text-slate-500 mb-1.5">{label} ({names.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {names.map(name => (
                          <span key={name} className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{name}</span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-3">Key Insights</h3>
              <ul className="space-y-2">
                {report.insights.map((insight, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-indigo-400 mt-0.5">◎</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Knowledge gaps */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <h3 className="font-bold text-slate-800 mb-3">Knowledge Gaps</h3>
              <ul className="space-y-2">
                {report.knowledgeGaps.map((gap, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-amber-400 mt-0.5">⚑</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow-up */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
              <h3 className="font-bold text-slate-800 mb-3">Suggested Next Lessons</h3>
              <ul className="space-y-2">
                {report.suggestedFollowUp.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-indigo-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
