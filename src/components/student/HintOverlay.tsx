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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-indigo-50 px-5 py-3 flex items-center justify-between border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span className="font-semibold text-indigo-800 text-sm">
              {latest.from === 'ai' ? 'A hint just for you' : 'Your teacher sent a hint'}
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-indigo-400 hover:text-indigo-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-slate-700 text-base leading-relaxed">{latest.content}</p>
        </div>
        <div className="px-5 pb-4">
          <button
            onClick={() => setVisible(false)}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl text-base hover:bg-indigo-700 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
