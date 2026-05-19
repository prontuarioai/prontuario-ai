import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { listarLocaisNegocio, buildOAuth2WithTokens } from '@/lib/google'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/configuracoes?error=google`)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { tokens } = await oauth2.getToken(code)

  // Get primary calendar
  const auth = buildOAuth2WithTokens(tokens.access_token!, tokens.refresh_token!)
  const calendar = google.calendar({ version: 'v3', auth })
  const { data: calList } = await calendar.calendarList.list().catch(() => ({ data: null }))
  const primaryCalId = calList?.items?.find((c) => c.primary)?.id ?? 'primary'

  await supabase.from('terapeutas').update({
    google_refresh_token: tokens.refresh_token,
    google_calendar_id: primaryCalId,
    google_calendar_connected: true,
  }).eq('id', user.id)

  // Get Business Profile locations
  const locais = await listarLocaisNegocio(tokens.access_token!)

  if (locais.length === 1 && locais[0].placeId) {
    await supabase.from('terapeutas').update({ google_place_id: locais[0].placeId }).eq('id', user.id)
    return NextResponse.redirect(`${origin}/configuracoes?google=success`)
  }

  if (locais.length > 1) {
    const locData = encodeURIComponent(JSON.stringify(
      locais.map(l => ({ nome: l.nome, placeId: l.placeId }))
    ))
    return NextResponse.redirect(`${origin}/onboarding/negocio?locations=${locData}&from=configuracoes`)
  }

  return NextResponse.redirect(`${origin}/configuracoes?google=success`)
}
