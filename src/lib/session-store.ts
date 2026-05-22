import type { Session } from './types'

declare global {
  // eslint-disable-next-line no-var
  var _sessions: Map<string, Session> | undefined
}

export function getSessionStore(): Map<string, Session> {
  if (!global._sessions) {
    global._sessions = new Map()
  }
  return global._sessions
}

export function getSession(id: string): Session | undefined {
  return getSessionStore().get(id)
}

export function setSession(session: Session): void {
  getSessionStore().set(session.id, session)
}

export function findSessionByPin(pin: string): Session | undefined {
  for (const session of getSessionStore().values()) {
    if (session.pin === pin && session.status === 'active') return session
  }
  return undefined
}

export function listSessions(): Session[] {
  return Array.from(getSessionStore().values())
}
