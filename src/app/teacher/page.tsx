'use client'
import Link from 'next/link'

export default function TeacherDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="nav-glass" style={{ padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.022em', background: 'linear-gradient(135deg, #0071e3, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inquire.ai</span>
          <span style={{ color: 'var(--divider)', fontSize: '20px', fontWeight: 300 }}>/</span>
          <span style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em' }}>Teacher</span>
        </div>
        <Link href="/teacher/plan" className="btn-primary" style={{ fontSize: '15px', padding: '8px 18px' }}>
          New lesson
        </Link>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
        {/* Empty state */}
        <div className="animate-fade-up" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(0,113,227,0.1), rgba(191,90,242,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', margin: '0 auto 24px'
          }}>🔬</div>
          <h1 className="headline-md" style={{ marginBottom: '12px' }}>Welcome to Inquire.ai</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '17px', letterSpacing: '-0.022em', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.5 }}>
            Create your first AI-generated IBL lesson. The 5E framework, student tasks, and rubrics — all done in seconds.
          </p>
          <Link href="/teacher/plan" className="btn-primary">
            Create your first lesson
          </Link>
        </div>
      </main>
    </div>
  )
}
