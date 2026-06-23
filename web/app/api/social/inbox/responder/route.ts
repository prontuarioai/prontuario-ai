import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return NextResponse.json({ error: 'Serviço social indisponível.' }, { status: 503 })

  const body = await request.json()

  const res = await fetch(`${socialApiUrl}/inbox/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ error: 'Erro ao enviar resposta.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
