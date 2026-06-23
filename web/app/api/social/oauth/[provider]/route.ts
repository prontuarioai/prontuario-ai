import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return NextResponse.json({ error: 'Serviço social indisponível.' }, { status: 503 })

  const res = await fetch(`${socialApiUrl}/accounts/oauth/${params.provider}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ error: 'Erro ao iniciar OAuth.' }, { status: 500 })

  const data = await res.json() as { url?: string }
  if (!data.url) return NextResponse.json({ error: 'URL OAuth não retornada.' }, { status: 500 })

  return NextResponse.redirect(data.url)
}
