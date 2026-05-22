'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [name, setName] = useState('')

  function handleJoin() {
    if (pin.length !== 6 || !name.trim()) return
    router.push(`/student/${pin}?name=${encodeURIComponent(name.trim())}`)
  }

  const ready = pin.length === 6 && name.trim().length > 0

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(191,90,242,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(0,113,227,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="animate-slide-up" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #bf5af2, #ff375f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(191,90,242,0.3)'
          }}>🎒</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>Join your class</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', letterSpacing: '-0.022em' }}>Enter your name and class PIN</p>
        </div>

        {/* Form card */}
        <div className="glass-strong card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '10px' }}>Your name</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
              style={{ fontSize: '19px', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '10px' }}>Class PIN</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{
                fontSize: '32px', fontFamily: 'monospace', letterSpacing: '0.2em',
                textAlign: 'center', padding: '16px', borderRadius: 'var(--radius-md)'
              }}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!ready}
            className="btn-primary"
            style={{ width: '100%', fontSize: '19px', padding: '16px', borderRadius: 'var(--radius-lg)', justifyContent: 'center' }}
          >
            Join class
          </button>
        </div>
      </div>
    </div>
  )
}
