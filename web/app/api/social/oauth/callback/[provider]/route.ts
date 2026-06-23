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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!socialApiUrl) {
    return NextResponse.redirect(`${appUrl}/social/contas?erro=servico_indisponivel`)
  }

  const forwardParams = new URLSearchParams()
  request.nextUrl.searchParams.forEach((value, key) => forwardParams.set(key, value))

  const res = await fetch(
    `${socialApiUrl}/accounts/oauth/${params.provider}/callback?${forwardParams}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  ).catch(() => null)

  if (!res?.ok) {
    return NextResponse.redirect(`${appUrl}/social/contas?erro=oauth_falhou`)
  }

  return NextResponse.redirect(`${appUrl}/social/contas?conectado=true`)
}
