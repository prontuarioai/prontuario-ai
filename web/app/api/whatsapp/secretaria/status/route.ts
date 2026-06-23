import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.clinica_id || terapeuta.role !== 'admin')
    return NextResponse.json({ connected: false })

  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return NextResponse.json({ connected: false })

  const res = await fetch(`${apiUrl}/whatsapp/secretaria/status/${terapeuta.clinica_id}`, {
    headers: { 'x-api-secret': apiSecret },
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ connected: false })
  return NextResponse.json(await res.json())
}
