import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  await supabase.from('terapeutas').update({
    google_refresh_token: null,
    google_calendar_id: null,
    google_calendar_connected: false,
  }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
