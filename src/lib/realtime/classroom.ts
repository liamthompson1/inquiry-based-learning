'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '../supabase/client'
import type { Session } from '../types'

export function useClassroomSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    fetch(`/api/sessions/${sessionId}`)
      .then(r => r.json())
      .then(({ session: s }) => { if (s) setSession(s) })
      .catch(console.error)

    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`classroom-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const s = (payload.new as { data: Session }).data
          if (s) setSession(s)
        }
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  return { session, setSession, connected }
}
