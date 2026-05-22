'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LessonPlan } from '@/lib/types'

const PHASE_COLORS: Record<string, string> = {
  engage:    'linear-gradient(135deg, #ff9f0a, #ff6b35)',
  explore:   'linear-gradient(135deg, #30d158, #0071e3)',
  explain:   'linear-gradient(135deg, #0071e3, #2997ff)',
  elaborate: 'linear-gradient(135deg, #bf5af2, #ff375f)',
  evaluate:  'linear-gradient(135deg, #ff453a, #bf5af2)',
}

const PHASE_LABELS: Record<string, string> = {
  engage: 'Engage', explore: 'Explore', explain: 'Explain',
  elaborate: 'Elaborate', evaluate: 'Evaluate'
}

export default function LessonPlannerPage() {
  const router = useRouter()
  const [form, setForm] = useState({ topic: '', gradeLevel: 'Primary 4', objectives: '', duration: 60 })
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<LessonPlan | null>(null)
  const [teacherName, setTeacherName] = useState('')
  const [launchLoading, setLaunchLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setPlan(null)
    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const { plan } = await res.json()
      setPlan(plan)
    } finally { setLoading(false) }
  }

  async function handleLaunch() {
    if (!plan || !teacherName) return
    setLaunchLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: plan, teacherName })
      })
      const { session } = await res.json()
      router.push(`/teacher/session/${session.id}`)
    } finally { setLaunchLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="nav-glass" style={{ padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/teacher" style={{ color: 'var(--accent)', fontSize: '15px', textDecoration: 'none', letterSpacing: '-0.016em' }}>Teacher</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.016em', fontWeight: 500 }}>Lesson Planner</span>
      </nav>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
          <h1 className="headline-lg" style={{ marginBottom: '8px' }}>New lesson</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '17px', letterSpacing: '-0.022em' }}>The AI agent will design a full 5E IBL plan with student tasks.</p>
        </div>

        {/* Form */}
        <div className="animate-fade-up delay-100 card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Topic</label>
              <input className="input" placeholder="e.g. Magnets and Forces" value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Grade level</label>
              <select className="input" value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))}
                style={{ cursor: 'pointer' }}>
                {['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Learning objectives</label>
            <textarea className="input" rows={3} style={{ resize: 'none' }}
              placeholder="e.g. Students will understand magnetic poles and predict attraction/repulsion"
              value={form.objectives} onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input className="input" type="number" value={form.duration} min={20} max={120} step={5}
                  onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                  style={{ width: '80px' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>minutes</span>
              </div>
            </div>
            <button className="btn-primary" onClick={handleGenerate}
              disabled={!form.topic || !form.objectives || loading}
              style={{ marginTop: '20px' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Generating…
                </span>
              ) : '✦ Generate plan'}
            </button>
          </div>
        </div>

        {/* Generated plan */}
        {plan && (
          <div className="animate-fade-up">
            {/* Summary */}
            <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, rgba(0,113,227,0.06), rgba(191,90,242,0.06))' }}>
              <div style={{ marginBottom: '12px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '22px', letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.topic}</h2>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em' }}>{plan.gradeLevel} · {plan.duration} min · 5E IBL</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {plan.objectives.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', marginTop: '3px', flexShrink: 0 }}>◎</span>
                    {o}
                  </div>
                ))}
              </div>
            </div>

            {/* Phases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {plan.phases.map((phase, i) => (
                <div key={phase.name} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: PHASE_COLORS[phase.name],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '13px', fontWeight: 700, flexShrink: 0
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>{PHASE_LABELS[phase.name]}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{phase.duration} min</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div className="label" style={{ marginBottom: '6px' }}>Teacher</div>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', letterSpacing: '-0.016em' }}>{phase.teacherInstructions}</p>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: '6px' }}>Student task · {phase.studentTask.inputType.replace('_', ' ')}</div>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '12px', background: 'rgba(0,113,227,0.05)', borderRadius: 'var(--radius-md)', letterSpacing: '-0.016em' }}>{phase.studentTask.instructions}</p>
                      {phase.studentTask.options && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {phase.studentTask.options.map((opt, j) => (
                            <span key={j} style={{ fontSize: '13px', color: 'var(--accent)', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.15)', borderRadius: '980px', padding: '4px 12px' }}>{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Launch */}
            <div className="card glass" style={{ background: 'var(--glass-bg)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '16px', color: 'var(--text-primary)' }}>Launch this session</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input className="input" placeholder="Your name (e.g. Ms Chen)" value={teacherName}
                  onChange={e => setTeacherName(e.target.value)} />
                <button className="btn-primary" onClick={handleLaunch}
                  disabled={!teacherName || launchLoading} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {launchLoading ? 'Launching…' : '🚀 Launch'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
