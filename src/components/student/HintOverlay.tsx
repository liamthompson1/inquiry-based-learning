'use client'
import { useState, useEffect } from 'react'
import type { Hint } from '@/lib/types'

interface HintOverlayProps {
  hints: Hint[]
}

export default function HintOverlay({ hints }: HintOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [lastCount, setLastCount] = useState(0)

  useEffect(() => {
    if (hints.length > lastCount) {
      setVisible(true)
      setLastCount(hints.length)
    }
  }, [hints.length, lastCount])

  const latest = hints.at(-1)
  if (!latest || !visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '16px', pointerEvents: 'none',
      animation: 'fade-in 0.3s ease both'
    }}>
      <div style={{
        pointerEvents: 'auto', width: '100%', maxWidth: '480px',
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid var(--divider)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--glass-shadow)',
        overflow: 'hidden',
        animation: 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--divider)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff9f0a, #ffcc02)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
            }}>💡</div>
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.016em' }}>
              {latest.from === 'ai' ? 'A hint just for you' : 'Hint from your teacher'}
            </span>
          </div>
          <button onClick={() => setVisible(false)} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', fontWeight: 400
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: '17px', color: 'var(--text-primary)', lineHeight: 1.55, letterSpacing: '-0.022em', margin: 0 }}>
            {latest.content}
          </p>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 18px 18px' }}>
          <button onClick={() => setVisible(false)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '17px', padding: '14px' }}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
