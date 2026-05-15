import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { listarLocaisNegocio, buildOAuth2WithTokens } from '@/lib/google'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Link inválido ou expirado.`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=Falha na autenticação.`)
  }

  const session = data.session
  if (!session?.provider_refresh_token || !session?.provider_token) {
    return response
  }

  const userId = session.user.id
  const providerToken = session.provider_token
  const providerRefreshToken = session.provider_refresh_token

  try {
    const auth = buildOAuth2WithTokens(providerToken, providerRefreshToken)
    const calendarApi = google.calendar({ version: 'v3', auth })
    const { data: calList } = await calendarApi.calendarList.list().catch(() => ({ data: null }))
    const primaryCalId = calList?.items?.find((c) => c.primary)?.id ?? 'primary'

    await supabase.from('terapeutas').update({
      google_refresh_token: providerRefreshToken,
      google_calendar_id: primaryCalId,
      google_calendar_connected: true,
    }).eq('id', userId)

    const locais = await listarLocaisNegocio(providerToken)

    if (locais.length === 1 && locais[0].placeId) {
      await supabase.from('terapeutas').update({ google_place_id: locais[0].placeId }).eq('id', userId)
    } else if (locais.length > 1) {
      const locData = encodeURIComponent(JSON.stringify(
        locais.map(l => ({ nome: l.nome, placeId: l.placeId }))
      ))
      return NextResponse.redirect(`${origin}/onboarding/negocio?locations=${locData}`)
    }
  } catch {
    // silently ignore — user is still logged in
  }

  return response
}
