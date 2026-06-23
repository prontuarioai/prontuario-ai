import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function GET() {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return NextResponse.json({ contas: [] })

  const res = await fetch(`${socialApiUrl}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ contas: [] })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const provider = request.nextUrl.searchParams.get('provider')
  if (!provider) return NextResponse.json({ error: 'Provider obrigatório.' }, { status: 400 })

  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return NextResponse.json({ error: 'Serviço social indisponível.' }, { status: 503 })

  const res = await fetch(`${socialApiUrl}/accounts/${provider}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ error: 'Erro ao desconectar.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
