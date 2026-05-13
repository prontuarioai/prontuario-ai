import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return NextResponse.json({ ok: true })

  await fetch(`${apiUrl}/whatsapp/disconnect/${user.id}`, {
    method: 'POST',
    headers: { 'x-api-secret': apiSecret },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
