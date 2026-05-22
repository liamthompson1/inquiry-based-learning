import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session-store'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ session })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updates = await request.json()
  const updated = { ...session, ...updates }
  setSession(updated)
  return NextResponse.json({ session: updated })
}
