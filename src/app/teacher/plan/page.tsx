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
  const [streamPreview, setStreamPreview] = useState('')
  const [plan, setPlan] = useState<LessonPlan | null>(null)
  const [error, setError] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [launchLoading, setLaunchLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setPlan(null)
    setError('')
    setStreamPreview('')

    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => 'Unknown error')
        throw new Error(`Server error ${res.status}: ${text}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Check for sentinel events
        const planIdx = buffer.indexOf('\x00PLAN\x00')
        const errIdx = buffer.indexOf('\x00ERROR\x00')

        if (errIdx !== -1) {
          const msg = buffer.slice(errIdx + 7)
          throw new Error(msg)
        }

        if (planIdx !== -1) {
          const jsonStr = buffer.slice(planIdx + 7)
          const parsed = JSON.parse(jsonStr)
          setPlan(parsed)
          setStreamPreview('')
          break
        }

        // Show raw JSON being built as live preview (strip leading whitespace/braces noise)
        const preview = buffer.replace(/\x00.*$/, '')
        setStreamPreview(preview)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleLaunch() {
    if (!plan || !teacherName) return
    setLaunchLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: plan, teacherName })
      })
      if (!res.ok) throw new Error('Failed to create session')
      const { session } = await res.json()
      router.push(`/teacher/session/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch session')
      setLaunchLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <nav className="nav-glass" style={{ padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/teacher" style={{ color: 'var(--accent)', fontSize: '15px', textDecoration: 'none' }}>Teacher</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>Lesson Planner</span>
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
              <input className="input" placeholder="e.g. Magnets and Forces"
                value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Grade level</label>
              <select className="input" value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} style={{ cursor: 'pointer' }}>
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
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
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
              disabled={!form.topic || !form.objectives || loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Generating…
                  </span>
                : '✦ Generate plan'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.25)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px',
            fontSize: '15px', color: 'var(--red)', letterSpacing: '-0.016em'
          }}>
            ✕ {error}
          </div>
        )}

        {/* Live stream preview while generating */}
        {loading && streamPreview && (
          <div className="card" style={{ marginBottom: '16px', background: 'rgba(0,113,227,0.02)' }}>
            <div className="label" style={{ marginBottom: '8px' }}>Building your lesson plan…</div>
            <pre style={{
              fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '160px',
              overflow: 'hidden', lineHeight: 1.4, margin: 0
            }}>{streamPreview.slice(-800)}</pre>
          </div>
        )}

        {/* Generated plan */}
        {plan && (
          <div className="animate-fade-up">
            <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, rgba(0,113,227,0.06), rgba(191,90,242,0.04))' }}>
              <h2 style={{ fontWeight: 700, fontSize: '22px', letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.topic}</h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', marginBottom: '12px' }}>{plan.gradeLevel} · {plan.duration} min · 5E IBL</p>
              {plan.objectives.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--accent)', marginTop: '3px', flexShrink: 0 }}>◎</span>{o}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {plan.phases.map((phase, i) => (
                <div key={phase.name} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: PHASE_COLORS[phase.name], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>{PHASE_LABELS[phase.name]}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{phase.duration} min</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div className="label" style={{ marginBottom: '6px' }}>Teacher</div>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', letterSpacing: '-0.016em', margin: 0 }}>{phase.teacherInstructions}</p>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: '6px' }}>Student · {phase.studentTask.inputType.replace('_', ' ')}</div>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '12px', background: 'rgba(0,113,227,0.05)', borderRadius: 'var(--radius-md)', letterSpacing: '-0.016em', margin: 0 }}>{phase.studentTask.instructions}</p>
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

            <div className="card glass" style={{ background: 'var(--glass-bg)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '16px', color: 'var(--text-primary)' }}>Launch this session</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input className="input" placeholder="Your name (e.g. Ms Chen)" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
                <button className="btn-primary" onClick={handleLaunch} disabled={!teacherName || launchLoading} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {launchLoading ? 'Launching…' : '🚀 Launch'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
