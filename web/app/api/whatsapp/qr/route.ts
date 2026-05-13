import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return NextResponse.json({ qr: null })

  const res = await fetch(`${apiUrl}/whatsapp/qr/${user.id}`, {
    headers: { 'x-api-secret': apiSecret },
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ qr: null })
  return NextResponse.json(await res.json())
}
