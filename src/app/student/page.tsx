'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleJoin() {
    if (pin.length !== 6 || !name.trim()) return
    router.push(`/student/${pin}?name=${encodeURIComponent(name.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎒</div>
          <h1 className="text-3xl font-bold text-white">Join your class</h1>
          <p className="text-white/70 mt-1">Enter your class PIN to start</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Your name</label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-lg border-2 border-slate-200 focus:border-indigo-400 rounded-2xl px-4 py-3 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Class PIN</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="6-digit PIN"
              value={pin}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setPin(val)
                setError('')
              }}
              className="w-full text-3xl font-mono tracking-widest text-center border-2 border-slate-200 focus:border-indigo-400 rounded-2xl px-4 py-4 focus:outline-none transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={pin.length !== 6 || !name.trim()}
            className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Join class →
          </button>
        </div>
      </div>
    </div>
  )
}
