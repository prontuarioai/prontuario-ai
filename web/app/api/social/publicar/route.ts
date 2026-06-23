import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return NextResponse.json({ error: 'Serviço social indisponível.' }, { status: 503 })

  const body = await request.json()
  const { conteudo, redes, imagemUrl, agendarPara } = body as {
    conteudo: string
    redes: string[]
    imagemUrl?: string
    agendarPara?: string
  }

  if (!conteudo || !redes?.length) {
    return NextResponse.json({ error: 'conteudo e redes são obrigatórios.' }, { status: 400 })
  }

  const res = await fetch(`${socialApiUrl}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ content: conteudo, platforms: redes, mediaUrl: imagemUrl, scheduledAt: agendarPara }),
  }).catch(() => null)

  if (!res?.ok) {
    const msg = await res?.text().catch(() => 'Erro desconhecido')
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ ok: true, postIds: data.postIds ?? [] })
}
