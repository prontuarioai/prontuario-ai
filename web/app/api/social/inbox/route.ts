import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return NextResponse.json({ items: [] })

  const rede = request.nextUrl.searchParams.get('rede') ?? ''
  const limite = request.nextUrl.searchParams.get('limite') ?? '50'

  const params = new URLSearchParams({ limit: limite })
  if (rede) params.set('platform', rede)

  const res = await fetch(`${socialApiUrl}/inbox?${params}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ items: [] })
  const data = await res.json()
  return NextResponse.json(data)
}
