import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

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
  oauth2.setCredentials(tokens)

  const calendar = google.calendar({ version: 'v3', auth: oauth2 })
  const { data: calList } = await calendar.calendarList.list()
  const primary = calList.items?.find(c => c.primary)?.id ?? 'primary'

  await supabase.from('terapeutas').update({
    google_refresh_token: tokens.refresh_token,
    google_calendar_id: primary,
    google_calendar_connected: true,
  }).eq('id', user.id)

  return NextResponse.redirect(`${origin}/configuracoes?google=success`)
}
