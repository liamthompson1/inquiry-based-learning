'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import type { PostLessonReport } from '@/lib/types'
import Link from 'next/link'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<PostLessonReport | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id }) })
      const { report } = await res.json()
      setReport(report)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <nav className="nav-glass" style={{ padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/teacher" style={{ color: 'var(--accent)', fontSize: '15px', textDecoration: 'none' }}>Teacher</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>Post-Lesson Report</span>
      </nav>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {!report ? (
          <div className="animate-fade-up" style={{ textAlign: 'center', paddingTop: '40px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(0,113,227,0.1), rgba(191,90,242,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 24px'
            }}>📊</div>
            <h1 className="headline-md" style={{ marginBottom: '12px' }}>Generate lesson report</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '380px', margin: '0 auto 32px', lineHeight: 1.5, letterSpacing: '-0.022em' }}>
              Claude will analyse all student submissions and produce actionable insights.
            </p>
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Analysing…
                  </span>
                : '✦ Generate report'}
            </button>
          </div>
        ) : (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Summary row */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,113,227,0.06), rgba(191,90,242,0.04))' }}>
              <h2 style={{ fontWeight: 700, fontSize: '22px', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text-primary)' }}>{report.topic}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '20px' }}>
                {[
                  { label: 'Students', value: report.studentCount, color: 'var(--accent)' },
                  { label: 'Class mastery', value: `${report.classMastery}%`, color: 'var(--green)' },
                  { label: 'Duration', value: `${report.duration}m`, color: 'var(--purple)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color, letterSpacing: '-0.04em' }}>{value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', letterSpacing: '-0.008em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div className="card">
              <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '16px', color: 'var(--text-primary)' }}>Student understanding</h3>
              {[
                { label: 'Strong', names: report.clusters.strong, color: 'var(--green)', cls: 'badge-strong' },
                { label: 'Partial', names: report.clusters.partial, color: 'var(--amber)', cls: 'badge-partial' },
                { label: 'Struggling', names: report.clusters.struggling, color: 'var(--red)', cls: 'badge-struggling' },
              ].filter(({ names }) => names.length > 0).map(({ label, names, cls }) => (
                <div key={label} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    {label} ({names.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {names.map(name => (
                      <span key={name} className={cls} style={{ padding: '4px 12px', borderRadius: '980px', fontSize: '13px', fontWeight: 500 }}>{name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="card">
              <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '12px', color: 'var(--text-primary)' }}>Key insights</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.insights.map((insight, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}>◎</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="card" style={{ borderColor: 'rgba(255,159,10,0.2)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '12px', color: 'var(--text-primary)' }}>Knowledge gaps</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.knowledgeGaps.map((gap, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '3px' }}>⚑</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow-up */}
            <div className="card" style={{ background: 'rgba(0,113,227,0.03)', borderColor: 'rgba(0,113,227,0.1)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.022em', marginBottom: '12px', color: 'var(--text-primary)' }}>Suggested next lessons</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.suggestedFollowUp.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
