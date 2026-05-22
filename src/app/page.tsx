import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%',
          background: 'radial-gradient(ellipse, rgba(0,113,227,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute', top: '10%', right: '-5%', width: '50%', height: '50%',
          background: 'radial-gradient(ellipse, rgba(191,90,242,0.14) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '20%', width: '60%', height: '50%',
          background: 'radial-gradient(ellipse, rgba(48,209,88,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
      </div>

      <main className="relative z-10 w-full max-w-lg px-6 text-center">
        {/* Logo mark */}
        <div className="animate-fade-in mb-6 flex justify-center">
          <div className="glass w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ borderRadius: 'var(--radius-lg)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="url(#grad)" opacity="0.9"/>
              <path d="M16 9l2.5 5h5l-4 3 1.5 5L16 19l-5 3 1.5-5-4-3h5z" fill="white"/>
              <defs>
                <linearGradient id="grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0071e3"/>
                  <stop offset="1" stopColor="#bf5af2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="animate-fade-up">
          <p className="label mb-3">Inquiry-Based Learning</p>
          <h1 className="headline-xl mb-4">
            <span className="gradient-text">Inquire</span>
            <span style={{ color: 'var(--text-primary)' }}>.ai</span>
          </h1>
          <p className="delay-100 animate-fade-up" style={{ color: 'var(--text-secondary)', fontSize: '19px', letterSpacing: '-0.025em', marginBottom: '48px' }}>
            Agentic, real-time inquiry-based learning.<br />
            Built on Singapore IBL research.
          </p>
        </div>

        {/* Entry cards */}
        <div className="delay-200 animate-fade-up flex flex-col gap-4">
          <Link
            href="/teacher"
            className="group glass card-hover block text-left"
            style={{ borderRadius: 'var(--radius-xl)', padding: '20px 24px', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0071e3, #2997ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', flexShrink: 0
              }}>👩‍🏫</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.022em' }}>Teacher</div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', marginTop: '2px' }}>Plan lessons, monitor live progress</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0, transition: 'transform 0.3s var(--ease-spring)' }} className="group-hover:translate-x-0.5">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>

          <Link
            href="/student"
            className="group glass card-hover block text-left"
            style={{ borderRadius: 'var(--radius-xl)', padding: '20px 24px', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #bf5af2, #ff375f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', flexShrink: 0
              }}>🎒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.022em' }}>Student</div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.016em', marginTop: '2px' }}>Join your class with a PIN</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        </div>

        <p className="delay-300 animate-fade-up" style={{ marginTop: '40px', fontSize: '13px', color: 'var(--text-tertiary)', letterSpacing: '-0.008em' }}>
          Powered by Claude AI · Singapore IBL Framework
        </p>
      </main>
    </div>
  )
}
