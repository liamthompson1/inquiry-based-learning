import { getSupabaseServer } from './supabase/server'
import type { Session } from './types'

export async function getSession(id: string): Promise<Session | undefined> {
  const { data } = await getSupabaseServer()
    .from('sessions')
    .select('data')
    .eq('id', id)
    .maybeSingle()
  return data?.data as Session | undefined
}

export async function setSession(session: Session): Promise<void> {
  await getSupabaseServer()
    .from('sessions')
    .upsert({ id: session.id, pin: session.pin, status: session.status, data: session })
}

export async function findSessionByPin(pin: string): Promise<Session | undefined> {
  const { data } = await getSupabaseServer()
    .from('sessions')
    .select('data')
    .eq('pin', pin)
    .in('status', ['waiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.data as Session | undefined
}

export async function listSessions(): Promise<Session[]> {
  const { data } = await getSupabaseServer()
    .from('sessions')
    .select('data')
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => r.data as Session)
}
